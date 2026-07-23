import { env } from "cloudflare:workers";

export type RuntimeEnv = {
  DB?: D1Database;
  ADMIN_PASSWORD_HASH?: string;
  ADMIN_USERNAME?: string;
  LICENSE_SECRET?: string;
  OWNER_LICENSE_ADMIN_TOKEN?: string;
  PADDLE_CLIENT_TOKEN?: string;
  PADDLE_ENVIRONMENT?: string;
  PADDLE_PRICE_ID?: string;
  PADDLE_WEBHOOK_SECRET?: string;
};

export type LicenseRecord = {
  id: string;
  transaction_id: string;
  customer_id: string | null;
  key_hash: string;
  key_last4: string;
  plan: string;
  status: string;
  max_devices: number;
  created_at: string;
  updated_at: string;
};

export function getRuntimeEnv(): RuntimeEnv {
  return env as unknown as RuntimeEnv;
}

export function requireDatabase(): D1Database {
  const database = getRuntimeEnv().DB;
  if (!database) throw new Error("License database is unavailable.");
  return database;
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

async function hmacSha256(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

export async function deriveLicenseKey(transactionId: string, secret: string): Promise<string> {
  const digest = (await hmacSha256(secret, `license:${transactionId}`)).slice(0, 20).toUpperCase();
  return `OS-${digest.match(/.{4}/g)?.join("-")}`;
}

export function normalizeLicenseKey(value: unknown): string {
  const compact = String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^OS/, "");
  return ["OS", ...(compact.match(/.{1,4}/g) ?? []).slice(0, 5)].join("-");
}

export function isLicenseKey(value: string): boolean {
  return /^OS(?:-[A-Z0-9]{4}){5}$/.test(value);
}

export async function findLicenseByKey(licenseKey: string): Promise<LicenseRecord | null> {
  const keyHash = await sha256(licenseKey);
  return requireDatabase()
    .prepare("SELECT * FROM licenses WHERE key_hash = ? LIMIT 1")
    .bind(keyHash)
    .first<LicenseRecord>();
}

export const licenseCorsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "POST, OPTIONS",
  "cache-control": "no-store",
};

export function licenseJson(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  for (const [key, value] of Object.entries(licenseCorsHeaders)) headers.set(key, value);
  return Response.json(data, { ...init, headers });
}

export function publicLicense(record: LicenseRecord) {
  return {
    plan: record.plan,
    status: record.status,
    licenseKeyLast4: record.key_last4,
    maxDevices: record.max_devices,
  };
}
