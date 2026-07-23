import { getRuntimeEnv, requireDatabase, sha256 } from "../../../db/license-store";

type SupportRequest = {
  email?: string;
  subject?: string;
  message?: string;
  website?: string;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as SupportRequest | null;
  if (body?.website) return Response.json({ ok: true });

  const email = String(body?.email ?? "").trim().toLowerCase();
  const subject = String(body?.subject ?? "").trim();
  const message = String(body?.message ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 2 || subject.length > 120 || message.length < 10 || message.length > 3000) {
    return Response.json({ message: "이메일, 제목, 문의 내용을 확인해 주세요." }, { status: 400 });
  }

  const secret = getRuntimeEnv().LICENSE_SECRET;
  if (!secret) return Response.json({ message: "고객지원 설정이 준비되지 않았습니다." }, { status: 503 });

  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const ipHash = await sha256(`${secret}:${ip}`);
  const database = requireDatabase();
  const recent = await database
    .prepare("SELECT COUNT(*) AS count FROM support_requests WHERE ip_hash = ? AND created_at >= ?")
    .bind(ipHash, new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .first<{ count: number }>();
  if ((recent?.count ?? 0) >= 5) {
    return Response.json({ message: "하루 문의 한도를 초과했습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  await database
    .prepare("INSERT INTO support_requests (id, email, subject, message, status, ip_hash, created_at) VALUES (?, ?, ?, ?, 'open', ?, ?)")
    .bind(crypto.randomUUID(), email, subject, message, ipHash, new Date().toISOString())
    .run();

  return Response.json({ ok: true });
}
