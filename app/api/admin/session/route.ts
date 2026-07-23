import {
  ADMIN_DEV_SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  verifyPassword,
} from "../../../../db/admin-auth.js";
import { clearLoginFailures, loginAllowed, recordLoginFailure } from "../../../../db/admin-login-store";
import { getRuntimeEnv } from "../../../../db/license-store";

function json(data: unknown, status = 200, headers?: Headers) {
  return Response.json(data, {
    status,
    headers: headers ?? {
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ message: "Invalid request origin." }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > 4096) {
    return json({ message: "Request is too large." }, 413);
  }

  const runtime = getRuntimeEnv();
  if (!runtime.ADMIN_PASSWORD_HASH || !runtime.LICENSE_SECRET) {
    return json({ message: "Admin login is not configured." }, 503);
  }
  if (!await loginAllowed(request, runtime)) {
    return json({ message: "Too many attempts. Try again in 15 minutes." }, 429);
  }

  const input = await request.json().catch(() => null) as { username?: unknown; password?: unknown } | null;
  const username = String(input?.username ?? "").trim();
  const password = String(input?.password ?? "");
  const usernameMatches = username === (runtime.ADMIN_USERNAME?.trim() || "admin");
  const passwordMatches = password.length <= 256 && await verifyPassword(password, runtime.ADMIN_PASSWORD_HASH);

  if (!usernameMatches || !passwordMatches) {
    await recordLoginFailure(request, runtime);
    return json({ message: "The username or password is incorrect." }, 401);
  }

  await clearLoginFailures(request, runtime);
  const session = await createAdminSession(runtime.LICENSE_SECRET);
  const secure = new URL(request.url).protocol === "https:";
  const cookieName = secure ? ADMIN_SESSION_COOKIE : ADMIN_DEV_SESSION_COOKIE;
  const headers = new Headers({
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  headers.set(
    "set-cookie",
    `${cookieName}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure ? "; Secure" : ""}`,
  );
  headers.append(
    "set-cookie",
    `onesearch_internal=1; Path=/; SameSite=Strict; Max-Age=43200${secure ? "; Secure" : ""}`,
  );
  return json({ authenticated: true }, 200, headers);
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ message: "Invalid request origin." }, 403);
  const headers = new Headers({
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  headers.append("set-cookie", `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  headers.append("set-cookie", `${ADMIN_DEV_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
  headers.append("set-cookie", "onesearch_internal=; Path=/; SameSite=Strict; Max-Age=0");
  return json({ authenticated: false }, 200, headers);
}
