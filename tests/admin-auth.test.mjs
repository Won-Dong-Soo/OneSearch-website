import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  createPasswordVerifier,
  readAdminSessionCookie,
  verifyAdminSession,
  verifyPassword,
} from "../db/admin-auth.js";

test("hashes and verifies the admin password", async () => {
  const salt = Uint8Array.from({ length: 16 }, (_, index) => index + 1);
  const verifier = await createPasswordVerifier("correct-horse-battery-staple", salt);

  assert.equal(await verifyPassword("correct-horse-battery-staple", verifier), true);
  assert.equal(await verifyPassword("wrong-password", verifier), false);
  assert.equal(await verifyPassword("correct-horse-battery-staple", "invalid"), false);
});

test("signs, expires, and rejects modified admin sessions", async () => {
  const now = Date.UTC(2026, 6, 23, 0, 0, 0);
  const session = await createAdminSession("a-long-license-secret-for-testing", now);

  assert.equal(await verifyAdminSession(session, "a-long-license-secret-for-testing", now + 1_000), true);
  assert.equal(await verifyAdminSession(`${session}x`, "a-long-license-secret-for-testing", now + 1_000), false);
  assert.equal(await verifyAdminSession(session, "wrong-secret", now + 1_000), false);
  assert.equal(await verifyAdminSession(session, "a-long-license-secret-for-testing", now + 13 * 60 * 60 * 1_000), false);
});

test("reads the admin session cookie without exposing other cookies", () => {
  const request = new Request("https://example.com/admin", {
    headers: { cookie: `theme=dark; ${ADMIN_SESSION_COOKIE}=signed-session; language=ko` },
  });
  assert.equal(readAdminSessionCookie(request), "signed-session");
});
