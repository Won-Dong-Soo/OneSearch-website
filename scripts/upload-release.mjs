import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [, , platform, inputPath] = process.argv;
const supportedPlatforms = new Set(["mac", "windows"]);
const uploadToken = process.env.RELEASE_UPLOAD_TOKEN?.trim() || "";
const siteUrl = (process.env.ONESEARCH_SITE_URL
  || "https://onesearch-download.adultdongsoo0516.chatgpt.site").replace(/\/+$/, "");
const partSize = Number(process.env.RELEASE_UPLOAD_PART_SIZE || 64 * 1024 * 1024);

if (!supportedPlatforms.has(platform) || !inputPath) {
  throw new Error("Usage: node scripts/upload-release.mjs <mac|windows> <file>");
}
if (!uploadToken) {
  throw new Error("RELEASE_UPLOAD_TOKEN is required");
}
if (
  !Number.isSafeInteger(partSize) ||
  partSize < 5 * 1024 * 1024 ||
  partSize > 95 * 1024 * 1024
) {
  throw new Error("RELEASE_UPLOAD_PART_SIZE must be between 5 MiB and 95 MiB");
}

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const manifest = JSON.parse(
  await readFile(path.join(projectRoot, "public", "release-manifest.json"), "utf8"),
);
const release = manifest.releases[platform];
const filePath = path.resolve(inputPath);
const fileStat = await stat(filePath);

if (fileStat.size !== release.bytes) {
  throw new Error(`Release size mismatch: expected ${release.bytes}, received ${fileStat.size}`);
}

async function fileSha256() {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filePath)) hash.update(chunk);
  return hash.digest("hex");
}

const digest = await fileSha256();
if (digest !== release.sha256) {
  throw new Error(`Release checksum mismatch: expected ${release.sha256}, received ${digest}`);
}

const endpoint = `${siteUrl}/api/download/${platform}`;
const authHeaders = {
  authorization: `Bearer ${uploadToken}`,
  "cache-control": "no-store",
};
let uploadId = "";

async function expectJson(response) {
  const text = await response.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { message: text || `HTTP ${response.status}` };
  }
  if (!response.ok) {
    throw new Error(payload.message || `Upload request failed with HTTP ${response.status}`);
  }
  return payload;
}

try {
  const created = await expectJson(await fetch(`${endpoint}?upload=create`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "x-release-size": String(release.bytes),
      "x-release-sha256": release.sha256,
    },
  }));
  uploadId = created.uploadId;

  const uploadedParts = [];
  const partCount = Math.ceil(fileStat.size / partSize);
  for (let index = 0; index < partCount; index += 1) {
    const start = index * partSize;
    const end = Math.min(fileStat.size - 1, start + partSize - 1);
    const contentLength = end - start + 1;
    const partNumber = index + 1;
    const body = createReadStream(filePath, { start, end });
    const query = new URLSearchParams({
      upload: "part",
      uploadId,
      partNumber: String(partNumber),
    });
    const uploaded = await expectJson(await fetch(`${endpoint}?${query}`, {
      method: "PUT",
      headers: {
        ...authHeaders,
        "content-length": String(contentLength),
        "content-type": "application/octet-stream",
      },
      body,
      duplex: "half",
    }));
    uploadedParts.push({
      partNumber: uploaded.partNumber,
      etag: uploaded.etag,
    });
    console.log(`[OneSearch] Uploaded ${partNumber}/${partCount} parts`);
  }

  const completeQuery = new URLSearchParams({ upload: "complete", uploadId });
  const completed = await expectJson(await fetch(`${endpoint}?${completeQuery}`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "content-type": "application/json",
    },
    body: JSON.stringify({ parts: uploadedParts }),
  }));
  console.log(JSON.stringify(completed, null, 2));
} catch (error) {
  if (uploadId) {
    const abortQuery = new URLSearchParams({ upload: "abort", uploadId });
    await fetch(`${endpoint}?${abortQuery}`, {
      method: "DELETE",
      headers: authHeaders,
    }).catch(() => {});
  }
  throw error;
}
