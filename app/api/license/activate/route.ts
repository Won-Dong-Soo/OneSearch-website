import {
  findLicenseByKey,
  isLicenseKey,
  licenseCorsHeaders,
  licenseJson,
  normalizeLicenseKey,
  publicLicense,
  requireDatabase,
  sha256,
} from "../../../../db/license-store";

type ActivationRequest = {
  licenseKey?: string;
  deviceId?: string;
  platform?: string;
  appVersion?: string;
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: licenseCorsHeaders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as ActivationRequest | null;
  const licenseKey = normalizeLicenseKey(body?.licenseKey);
  const deviceId = String(body?.deviceId ?? "").trim();

  if (!isLicenseKey(licenseKey) || deviceId.length < 8) {
    return licenseJson({ message: "라이선스 키 또는 기기 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const license = await findLicenseByKey(licenseKey);
  if (!license || license.status !== "active") {
    return licenseJson({ message: "사용할 수 없는 라이선스입니다." }, { status: 403 });
  }

  const database = requireDatabase();
  const deviceHash = await sha256(deviceId);
  const existing = await database
    .prepare("SELECT id FROM license_activations WHERE license_id = ? AND device_hash = ? LIMIT 1")
    .bind(license.id, deviceHash)
    .first<{ id: string }>();
  const now = new Date().toISOString();

  if (existing) {
    await database
      .prepare("UPDATE license_activations SET platform = ?, app_version = ?, last_validated_at = ? WHERE id = ?")
      .bind(String(body?.platform ?? "desktop").slice(0, 120), String(body?.appVersion ?? "").slice(0, 32), now, existing.id)
      .run();
  } else {
    const count = await database
      .prepare("SELECT COUNT(*) AS count FROM license_activations WHERE license_id = ?")
      .bind(license.id)
      .first<{ count: number }>();
    if ((count?.count ?? 0) >= license.max_devices) {
      return licenseJson({ message: `허용된 ${license.max_devices}대의 기기를 모두 사용 중입니다.` }, { status: 409 });
    }

    await database
      .prepare(`INSERT INTO license_activations
        (id, license_id, device_hash, platform, app_version, activated_at, last_validated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        crypto.randomUUID(),
        license.id,
        deviceHash,
        String(body?.platform ?? "desktop").slice(0, 120),
        String(body?.appVersion ?? "").slice(0, 32),
        now,
        now,
      )
      .run();
  }

  return licenseJson({ ok: true, license: publicLicense(license) });
}
