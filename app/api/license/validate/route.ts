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

export function OPTIONS() {
  return new Response(null, { status: 204, headers: licenseCorsHeaders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    licenseKey?: string;
    deviceId?: string;
    platform?: string;
    appVersion?: string;
  } | null;
  const licenseKey = normalizeLicenseKey(body?.licenseKey);
  const deviceId = String(body?.deviceId ?? "").trim();

  if (!isLicenseKey(licenseKey) || deviceId.length < 8) {
    return licenseJson({ message: "라이선스 확인 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const license = await findLicenseByKey(licenseKey);
  if (!license || license.status !== "active") {
    return licenseJson({ message: "라이선스가 비활성화되었습니다." }, { status: 403 });
  }

  const database = requireDatabase();
  const deviceHash = await sha256(deviceId);
  const activation = await database
    .prepare("SELECT id FROM license_activations WHERE license_id = ? AND device_hash = ? LIMIT 1")
    .bind(license.id, deviceHash)
    .first<{ id: string }>();
  if (!activation) {
    return licenseJson({ message: "이 기기에 등록되지 않은 라이선스입니다." }, { status: 403 });
  }

  await database
    .prepare("UPDATE license_activations SET platform = ?, app_version = ?, last_validated_at = ? WHERE id = ?")
    .bind(
      String(body?.platform ?? "desktop").slice(0, 120),
      String(body?.appVersion ?? "").slice(0, 32),
      new Date().toISOString(),
      activation.id,
    )
    .run();

  return licenseJson({ ok: true, license: publicLicense(license) });
}
