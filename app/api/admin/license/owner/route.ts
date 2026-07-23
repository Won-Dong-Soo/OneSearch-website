import {
  deriveLicenseKey,
  getRuntimeEnv,
  requireDatabase,
  sha256,
} from "../../../../../db/license-store";
import { readBearerToken, secureTokenEqual } from "./auth.js";

const OWNER_LICENSE_ID = "license-owner-primary";
const OWNER_TRANSACTION_ID = "owner_primary_v1";

function adminJson(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      "cache-control": "no-store",
      "content-security-policy": "default-src 'none'",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const runtime = getRuntimeEnv();
  if (!runtime.LICENSE_SECRET || !runtime.OWNER_LICENSE_ADMIN_TOKEN) {
    return adminJson({ message: "소유자 라이선스 발급 설정이 완료되지 않았습니다." }, 503);
  }

  const providedToken = readBearerToken(request.headers.get("authorization"));
  if (!secureTokenEqual(providedToken, runtime.OWNER_LICENSE_ADMIN_TOKEN)) {
    return adminJson({ message: "관리자 인증에 실패했습니다." }, 401);
  }

  const licenseKey = await deriveLicenseKey(OWNER_TRANSACTION_ID, runtime.LICENSE_SECRET);
  const now = new Date().toISOString();
  await requireDatabase()
    .prepare(`INSERT INTO licenses
      (id, transaction_id, customer_id, key_hash, key_last4, plan, status, max_devices, created_at, updated_at)
      VALUES (?, ?, NULL, ?, ?, 'founding_pro', 'active', 3, ?, ?)
      ON CONFLICT(transaction_id) DO UPDATE SET
        key_hash = excluded.key_hash,
        key_last4 = excluded.key_last4,
        plan = 'founding_pro',
        status = 'active',
        max_devices = 3,
        updated_at = excluded.updated_at`)
    .bind(
      OWNER_LICENSE_ID,
      OWNER_TRANSACTION_ID,
      await sha256(licenseKey),
      licenseKey.slice(-4),
      now,
      now,
    )
    .run();

  return adminJson({
    ok: true,
    licenseKey,
    plan: "founding_pro",
    maxDevices: 3,
  });
}
