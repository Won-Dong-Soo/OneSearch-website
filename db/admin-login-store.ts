import { sha256, type RuntimeEnv } from "./license-store";

const WINDOW_SECONDS = 15 * 60;
const MAX_ATTEMPTS = 8;
let tableReady = false;

async function ensureTable(database: D1Database) {
  if (tableReady) return;
  await database.prepare(`CREATE TABLE IF NOT EXISTS admin_login_attempts (
    key text PRIMARY KEY NOT NULL,
    attempts integer DEFAULT 0 NOT NULL,
    expires_at integer NOT NULL
  )`).run();
  tableReady = true;
}

async function attemptKey(request: Request, secret: string): Promise<string> {
  const address = request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  return sha256(`${secret}:admin-login:${address}`);
}

export async function loginAllowed(request: Request, runtime: RuntimeEnv): Promise<boolean> {
  if (!runtime.DB || !runtime.LICENSE_SECRET) return true;
  await ensureTable(runtime.DB);
  const now = Math.floor(Date.now() / 1000);
  const row = await runtime.DB
    .prepare("SELECT attempts, expires_at FROM admin_login_attempts WHERE key = ? LIMIT 1")
    .bind(await attemptKey(request, runtime.LICENSE_SECRET))
    .first<{ attempts: number; expires_at: number }>();
  return !row || row.expires_at <= now || row.attempts < MAX_ATTEMPTS;
}

export async function recordLoginFailure(request: Request, runtime: RuntimeEnv): Promise<void> {
  if (!runtime.DB || !runtime.LICENSE_SECRET) return;
  await ensureTable(runtime.DB);
  const now = Math.floor(Date.now() / 1000);
  const key = await attemptKey(request, runtime.LICENSE_SECRET);
  await runtime.DB.prepare(`INSERT INTO admin_login_attempts (key, attempts, expires_at)
    VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      attempts = CASE WHEN expires_at <= ? THEN 1 ELSE attempts + 1 END,
      expires_at = CASE WHEN expires_at <= ? THEN excluded.expires_at ELSE expires_at END`)
    .bind(key, now + WINDOW_SECONDS, now, now)
    .run();
}

export async function clearLoginFailures(request: Request, runtime: RuntimeEnv): Promise<void> {
  if (!runtime.DB || !runtime.LICENSE_SECRET) return;
  await ensureTable(runtime.DB);
  await runtime.DB
    .prepare("DELETE FROM admin_login_attempts WHERE key = ?")
    .bind(await attemptKey(request, runtime.LICENSE_SECRET))
    .run();
}
