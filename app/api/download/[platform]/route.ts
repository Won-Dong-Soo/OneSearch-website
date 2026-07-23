import { env } from "cloudflare:workers";
import {
  getReleaseConfig,
  type ReleaseConfig,
} from "../../../release-config";

type RuntimeEnv = {
  DOWNLOADS?: R2Bucket;
  RELEASE_UPLOAD_TOKEN?: string;
};

type ByteRange = { offset: number; length: number };

const MAX_MULTIPART_CHUNK_BYTES = 95 * 1024 * 1024;

function getRuntimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

function parseByteRange(value: string | null, total: number): ByteRange | null | undefined {
  if (!value) return undefined;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;

  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    const length = Math.min(suffixLength, total);
    return { offset: total - length, length };
  }

  const start = Number(match[1]);
  const requestedEnd = match[2] ? Number(match[2]) : total - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(requestedEnd) ||
    start < 0 ||
    start >= total ||
    requestedEnd < start
  ) {
    return null;
  }

  const end = Math.min(requestedEnd, total - 1);
  return { offset: start, length: end - start + 1 };
}

function createDownloadHeaders(
  config: ReleaseConfig,
  object: R2Object,
  contentLength: number,
): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", config.contentType);
  headers.set("content-disposition", `attachment; filename="${config.filename}"`);
  headers.set("content-length", String(contentLength));
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "public, max-age=3600");
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-onesearch-sha256", config.sha256);
  return headers;
}

async function resolveRequest(
  context: { params: Promise<{ platform: string }> },
): Promise<{ config: ReleaseConfig; bucket: R2Bucket } | Response> {
  const { platform } = await context.params;
  const config = getReleaseConfig(platform);
  if (!config) return new Response("Not found", { status: 404 });

  const bucket = getRuntimeEnv().DOWNLOADS;
  if (!bucket) return new Response("Download storage unavailable", { status: 503 });
  return { config, bucket };
}

function uploadAuthorized(request: Request): boolean {
  const runtimeEnv = getRuntimeEnv();
  const authHeader = request.headers.get("authorization");
  const uploadToken = request.headers.get("x-release-upload-token")
    ?? (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "");
  return Boolean(
    runtimeEnv.RELEASE_UPLOAD_TOKEN
    && uploadToken === runtimeEnv.RELEASE_UPLOAD_TOKEN,
  );
}

function validateReleaseHeaders(request: Request, config: ReleaseConfig): Response | null {
  const contentLength = Number(
    request.headers.get("x-release-size")
    ?? request.headers.get("content-length"),
  );
  if (contentLength !== config.bytes) {
    return Response.json(
      { message: `Expected ${config.bytes} bytes.` },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  if (request.headers.get("x-release-sha256") !== config.sha256) {
    return Response.json(
      { message: "Release checksum does not match the manifest." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  return null;
}

function resumeMultipartUpload(
  request: Request,
  config: ReleaseConfig,
  bucket: R2Bucket,
): R2MultipartUpload | Response {
  const uploadId = new URL(request.url).searchParams.get("uploadId")?.trim() ?? "";
  if (!uploadId || uploadId.length > 1024) {
    return Response.json(
      { message: "Invalid multipart upload ID." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
  return bucket.resumeMultipartUpload(config.key, uploadId);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const resolved = await resolveRequest(context);
  if (resolved instanceof Response) return resolved;
  const { config, bucket } = resolved;

  const range = parseByteRange(request.headers.get("range"), config.bytes);
  if (range === null) {
    return new Response("Range not satisfiable", {
      status: 416,
      headers: {
        "accept-ranges": "bytes",
        "content-range": `bytes */${config.bytes}`,
      },
    });
  }

  const object = range
    ? await bucket.get(config.key, { range })
    : await bucket.get(config.key);
  if (!object) return new Response("Release not found", { status: 404 });

  const contentLength = range?.length ?? object.size;
  const headers = createDownloadHeaders(config, object, contentLength);
  if (!range && request.headers.get("if-none-match") === object.httpEtag) {
    headers.delete("content-length");
    headers.delete("content-disposition");
    return new Response(null, { status: 304, headers });
  }
  if (range) {
    headers.set(
      "content-range",
      `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`,
    );
  }

  return new Response(object.body, { status: range ? 206 : 200, headers });
}

export async function HEAD(
  _request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const resolved = await resolveRequest(context);
  if (resolved instanceof Response) return resolved;
  const { config, bucket } = resolved;

  const object = await bucket.head(config.key);
  if (!object) return new Response("Release not found", { status: 404 });
  return new Response(null, {
    headers: createDownloadHeaders(config, object, object.size),
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const resolved = await resolveRequest(context);
  if (resolved instanceof Response) return resolved;
  const { config, bucket } = resolved;
  if (!uploadAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!request.body) return new Response("Missing file", { status: 400 });

  const url = new URL(request.url);
  if (url.searchParams.get("upload") === "part") {
    const upload = resumeMultipartUpload(request, config, bucket);
    if (upload instanceof Response) return upload;

    const partNumber = Number(url.searchParams.get("partNumber"));
    const contentLength = Number(request.headers.get("content-length"));
    if (
      !Number.isSafeInteger(partNumber) ||
      partNumber < 1 ||
      partNumber > 10000 ||
      !Number.isSafeInteger(contentLength) ||
      contentLength <= 0 ||
      contentLength > MAX_MULTIPART_CHUNK_BYTES
    ) {
      return Response.json(
        { message: "Invalid multipart chunk." },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }

    const uploadedPart = await upload.uploadPart(partNumber, request.body);
    return Response.json(
      {
        ok: true,
        partNumber: uploadedPart.partNumber,
        etag: uploadedPart.etag,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const invalidHeaders = validateReleaseHeaders(request, config);
  if (invalidHeaders) return invalidHeaders;

  const object = await bucket.put(config.key, request.body, {
    httpMetadata: { contentType: config.contentType },
    customMetadata: { sha256: config.sha256 },
  });

  return Response.json(
    {
      ok: true,
      filename: config.filename,
      bytes: object.size,
      sha256: config.sha256,
      etag: object.httpEtag,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(
  request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const resolved = await resolveRequest(context);
  if (resolved instanceof Response) return resolved;
  const { config, bucket } = resolved;
  if (!uploadAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const action = new URL(request.url).searchParams.get("upload");
  if (action === "create") {
    const invalidHeaders = validateReleaseHeaders(request, config);
    if (invalidHeaders) return invalidHeaders;

    const upload = await bucket.createMultipartUpload(config.key, {
      httpMetadata: { contentType: config.contentType },
      customMetadata: { sha256: config.sha256 },
    });
    return Response.json(
      { ok: true, uploadId: upload.uploadId },
      { headers: { "cache-control": "no-store" } },
    );
  }

  if (action === "complete") {
    const upload = resumeMultipartUpload(request, config, bucket);
    if (upload instanceof Response) return upload;

    const payload = await request.json() as {
      parts?: Array<{ partNumber?: number; etag?: string }>;
    };
    const parts = payload.parts;
    if (
      !Array.isArray(parts) ||
      parts.length === 0 ||
      parts.length > 10000 ||
      parts.some((part) => (
        !Number.isSafeInteger(part.partNumber) ||
        Number(part.partNumber) < 1 ||
        typeof part.etag !== "string" ||
        !part.etag
      ))
    ) {
      return Response.json(
        { message: "Invalid multipart completion payload." },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }

    const object = await upload.complete(parts as R2UploadedPart[]);
    if (object.size !== config.bytes) {
      return Response.json(
        { message: `Completed object has ${object.size} bytes; expected ${config.bytes}.` },
        { status: 500, headers: { "cache-control": "no-store" } },
      );
    }

    return Response.json(
      {
        ok: true,
        filename: config.filename,
        bytes: object.size,
        sha256: config.sha256,
        etag: object.httpEtag,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  return new Response("Unsupported upload action", { status: 400 });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ platform: string }> },
) {
  const resolved = await resolveRequest(context);
  if (resolved instanceof Response) return resolved;
  const { config, bucket } = resolved;
  if (!uploadAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const upload = resumeMultipartUpload(request, config, bucket);
  if (upload instanceof Response) return upload;
  await upload.abort();
  return Response.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
