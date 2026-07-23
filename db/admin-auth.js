const encoder = new TextEncoder();
const SESSION_TTL_SECONDS = 12 * 60 * 60;

export const ADMIN_SESSION_COOKIE = "__Host-onesearch_admin";
export const ADMIN_DEV_SESSION_COOKIE = "onesearch_admin";

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function derivePasswordHash(password, salt, iterations) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  ));
}

async function derivePortablePasswordHash(password, salt) {
  const passwordBytes = encoder.encode(password);
  const input = new Uint8Array(salt.length + passwordBytes.length);
  input.set(salt);
  input.set(passwordBytes, salt.length);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", input));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function createPasswordVerifier(password, salt = crypto.getRandomValues(new Uint8Array(16))) {
  const hash = await derivePortablePasswordHash(password, salt);
  return `sha256-v1.${bytesToBase64Url(salt)}.${bytesToBase64Url(hash)}`;
}

export async function verifyPassword(password, verifier) {
  const serialized = String(verifier ?? "");
  const delimiter = serialized.includes("$") ? "$" : ".";
  const parts = serialized.split(delimiter);
  if (parts[0] === "sha256-v1" && parts.length === 3) {
    try {
      const candidate = bytesToBase64Url(
        await derivePortablePasswordHash(String(password ?? ""), base64UrlToBytes(parts[1])),
      );
      return constantTimeEqual(candidate, parts[2]);
    } catch {
      return false;
    }
  }

  const [algorithm, iterationsText, saltText, expectedText] = parts;
  const iterations = Number(iterationsText);
  if (
    algorithm !== "pbkdf2-sha256" ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100_000 ||
    iterations > 1_000_000 ||
    !saltText ||
    !expectedText
  ) {
    return false;
  }

  try {
    const candidate = bytesToBase64Url(
      await derivePasswordHash(String(password ?? ""), base64UrlToBytes(saltText), iterations),
    );
    return constantTimeEqual(candidate, expectedText);
  } catch {
    return false;
  }
}

export async function createAdminSession(secret, now = Date.now()) {
  const expiresAt = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const nonce = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `v1.${expiresAt}.${nonce}`;
  const signature = bytesToBase64Url(await hmac(secret, `admin-session:${payload}`));
  return `${payload}.${signature}`;
}

export async function verifyAdminSession(token, secret, now = Date.now()) {
  const [version, expiresText, nonce, signature] = String(token ?? "").split(".");
  const expiresAt = Number(expiresText);
  if (
    version !== "v1" ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(now / 1000) ||
    expiresAt > Math.floor(now / 1000) + SESSION_TTL_SECONDS + 60 ||
    !/^[A-Za-z0-9_-]{20,}$/.test(nonce ?? "") ||
    !/^[A-Za-z0-9_-]{40,}$/.test(signature ?? "")
  ) {
    return false;
  }

  const payload = `${version}.${expiresAt}.${nonce}`;
  const expected = bytesToBase64Url(await hmac(secret, `admin-session:${payload}`));
  return constantTimeEqual(signature, expected);
}

export function readAdminSessionCookie(request) {
  const cookies = new Map(
    String(request.headers.get("cookie") ?? "")
      .split(";")
      .map((part) => part.trim().split(/=(.*)/s, 2))
      .filter(([key, value]) => key && value !== undefined),
  );
  return cookies.get(ADMIN_SESSION_COOKIE) ?? cookies.get(ADMIN_DEV_SESSION_COOKIE) ?? "";
}
