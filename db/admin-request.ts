import { verifyAdminSession, readAdminSessionCookie } from "./admin-auth.js";
import { moderatorAuthorized } from "./community-store";
import { getRuntimeEnv } from "./license-store";

export async function adminRequestAuthorized(request: Request): Promise<boolean> {
  if (moderatorAuthorized(request)) return true;

  const secret = getRuntimeEnv().LICENSE_SECRET?.trim();
  if (!secret) return false;
  return verifyAdminSession(readAdminSessionCookie(request), secret);
}
