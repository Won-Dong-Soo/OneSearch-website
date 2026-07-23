import {
  findLicenseByKey,
  isLicenseKey,
  licenseCorsHeaders,
  licenseJson,
  normalizeLicenseKey,
  requireDatabase,
  sha256,
} from "../../../../db/license-store";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: licenseCorsHeaders });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { licenseKey?: string; deviceId?: string } | null;
  const licenseKey = normalizeLicenseKey(body?.licenseKey);
  const deviceId = String(body?.deviceId ?? "").trim();
  if (!isLicenseKey(licenseKey) || deviceId.length < 8) {
    return licenseJson({ message: "라이선스 확인 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const license = await findLicenseByKey(licenseKey);
  if (!license) return licenseJson({ message: "라이선스를 찾을 수 없습니다." }, { status: 404 });

  await requireDatabase()
    .prepare("DELETE FROM license_activations WHERE license_id = ? AND device_hash = ?")
    .bind(license.id, await sha256(deviceId))
    .run();

  return licenseJson({ ok: true });
}
