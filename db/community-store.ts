import { getRuntimeEnv, sha256 } from "./license-store";

export type CommunityPostType = "question" | "discussion";

export type CommunityPostRow = {
  id: string;
  type: CommunityPostType;
  title: string;
  body: string;
  author_name: string;
  author_secret_hash?: string;
  status: string;
  created_at: string;
  updated_at: string;
  comment_count?: number;
};

export type CommunityCommentRow = {
  id: string;
  post_id: string;
  body: string;
  author_name: string;
  author_secret_hash?: string;
  created_at: string;
};

export function communityJson(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

export function cleanCommunityText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export function validPostType(value: unknown): CommunityPostType | null {
  return value === "question" || value === "discussion" ? value : null;
}

export function hasTooManyLinks(value: string, maximum = 4): boolean {
  return (value.match(/https?:\/\//gi) ?? []).length > maximum;
}

function communitySecret(): string | null {
  return getRuntimeEnv().LICENSE_SECRET?.trim() || null;
}

export async function requestIpHash(request: Request): Promise<string | null> {
  const secret = communitySecret();
  if (!secret) return null;
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  return sha256(`${secret}:community-ip:${ip}`);
}

export async function managementCodeHash(value: unknown): Promise<string | null> {
  const secret = communitySecret();
  const code = String(value ?? "").trim();
  if (!secret || code.length < 6 || code.length > 40) return null;
  return sha256(`${secret}:community-code:${code}`);
}

function secureStringEqual(candidate: string | null, expected: string | null): boolean {
  if (!candidate || !expected || candidate.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < candidate.length; index += 1) {
    difference |= candidate.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export async function managementCodeMatches(value: unknown, expectedHash: string): Promise<boolean> {
  const candidate = await managementCodeHash(value);
  return secureStringEqual(candidate, expectedHash);
}

export function moderatorAuthorized(request: Request): boolean {
  const expected = getRuntimeEnv().OWNER_LICENSE_ADMIN_TOKEN?.trim() ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]{32,})$/.exec(request.headers.get("authorization")?.trim() ?? "");
  const candidate = match?.[1] ?? "";
  return secureStringEqual(candidate, expected);
}

export function publicCommunityPost(row: CommunityPostRow) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    authorName: row.author_name,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    commentCount: Number(row.comment_count ?? 0),
  };
}

export function publicCommunityComment(row: CommunityCommentRow) {
  return {
    id: row.id,
    postId: row.post_id,
    body: row.body,
    authorName: row.author_name,
    createdAt: row.created_at,
  };
}
