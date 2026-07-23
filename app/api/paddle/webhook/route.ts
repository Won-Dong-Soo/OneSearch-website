import {
  deriveLicenseKey,
  getRuntimeEnv,
  requireDatabase,
  sha256,
} from "../../../../db/license-store";

type PaddleEvent = {
  event_id: string;
  event_type: string;
  occurred_at?: string;
  data: Record<string, unknown>;
};

function parseSignature(header: string) {
  const values = header.split(";").map((part) => part.split("=", 2));
  return {
    timestamp: values.find(([key]) => key === "ts")?.[1] ?? "",
    signatures: values.filter(([key]) => key === "h1").map(([, value]) => value),
  };
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function hmacHex(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyWebhook(rawBody: string, header: string, secret: string): Promise<boolean> {
  const { timestamp, signatures } = parseSignature(header);
  if (!/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (ageSeconds > 300) return false;
  const expected = await hmacHex(secret, `${timestamp}:${rawBody}`);
  return signatures.some((signature) => safeEqual(expected, signature));
}

function transactionContainsPrice(data: Record<string, unknown>, priceId: string): boolean {
  const items = Array.isArray(data.items) ? data.items : [];
  return items.some((item) => {
    if (!item || typeof item !== "object") return false;
    const price = (item as { price?: { id?: string } }).price;
    return price?.id === priceId;
  });
}

export async function POST(request: Request) {
  const runtime = getRuntimeEnv();
  if (!runtime.PADDLE_WEBHOOK_SECRET || !runtime.PADDLE_PRICE_ID || !runtime.LICENSE_SECRET) {
    return Response.json({ message: "Webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("paddle-signature") ?? "";
  if (!await verifyWebhook(rawBody, signature, runtime.PADDLE_WEBHOOK_SECRET)) {
    return Response.json({ message: "Invalid webhook signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaddleEvent;
  const database = requireDatabase();
  const processed = await database
    .prepare("SELECT id FROM paddle_webhook_events WHERE id = ? LIMIT 1")
    .bind(event.event_id)
    .first<{ id: string }>();
  if (processed) return Response.json({ ok: true, duplicate: true });

  if (event.event_type === "transaction.completed" && transactionContainsPrice(event.data, runtime.PADDLE_PRICE_ID)) {
    const transactionId = String(event.data.id ?? "");
    const licenseKey = await deriveLicenseKey(transactionId, runtime.LICENSE_SECRET);
    const now = new Date().toISOString();
    await database
      .prepare(`INSERT OR IGNORE INTO licenses
        (id, transaction_id, customer_id, key_hash, key_last4, plan, status, max_devices, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'founding_pro', 'active', 3, ?, ?)`)
      .bind(
        crypto.randomUUID(),
        transactionId,
        event.data.customer_id ? String(event.data.customer_id) : null,
        await sha256(licenseKey),
        licenseKey.slice(-4),
        now,
        now,
      )
      .run();
  }

  if (
    event.event_type === "adjustment.updated" &&
    event.data.action === "refund" &&
    event.data.status === "approved" &&
    event.data.transaction_id
  ) {
    await database
      .prepare("UPDATE licenses SET status = 'revoked', updated_at = ? WHERE transaction_id = ?")
      .bind(new Date().toISOString(), String(event.data.transaction_id))
      .run();
  }

  await database
    .prepare("INSERT OR IGNORE INTO paddle_webhook_events (id, event_type, occurred_at, processed_at) VALUES (?, ?, ?, ?)")
    .bind(event.event_id, event.event_type, event.occurred_at ?? null, new Date().toISOString())
    .run();

  return Response.json({ ok: true });
}
