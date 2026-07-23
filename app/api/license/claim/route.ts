import { deriveLicenseKey, getRuntimeEnv, requireDatabase } from "../../../../db/license-store";

export async function GET(request: Request) {
  const transactionId = new URL(request.url).searchParams.get("transaction_id")?.trim() ?? "";
  if (!/^txn_[a-z0-9]{20,40}$/.test(transactionId)) {
    return Response.json({ message: "결제 번호가 올바르지 않습니다." }, { status: 400 });
  }

  const license = await requireDatabase()
    .prepare("SELECT status FROM licenses WHERE transaction_id = ? LIMIT 1")
    .bind(transactionId)
    .first<{ status: string }>();
  if (!license) return Response.json({ pending: true }, { status: 404 });
  if (license.status !== "active") {
    return Response.json({ message: "이 결제의 라이선스를 사용할 수 없습니다." }, { status: 403 });
  }

  const secret = getRuntimeEnv().LICENSE_SECRET;
  if (!secret) return Response.json({ message: "라이선스 발급 설정이 완료되지 않았습니다." }, { status: 503 });

  return Response.json({
    ok: true,
    licenseKey: await deriveLicenseKey(transactionId, secret),
  }, { headers: { "cache-control": "no-store" } });
}
