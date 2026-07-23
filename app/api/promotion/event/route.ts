import { env } from "cloudflare:workers";
import { ensurePromotionMetricsTable } from "../../../../db/promotion-store";

type RuntimeEnv = { DB?: D1Database };

const EVENT_TYPES = new Set([
  "page_view",
  "share",
  "share_copy",
  "press_copy",
  "download_mac",
  "download_windows",
  "checkout_open",
]);

function dimension(value: unknown, fallback: string, maximum = 80): string {
  const cleaned = String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._/-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maximum);
  return cleaned || fallback;
}

export async function POST(request: Request) {
  const database = (env as unknown as RuntimeEnv).DB;
  if (!database) return new Response(null, { status: 204 });
  await ensurePromotionMetricsTable(database);

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const event = dimension(body?.event, "invalid", 32);
  if (!EVENT_TYPES.has(event)) {
    return Response.json({ message: "지원하지 않는 이벤트입니다." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const day = now.slice(0, 10);
  const path = dimension(body?.path, "/", 120);
  const platform = dimension(body?.platform, "unknown", 24);
  const source = dimension(body?.source, "direct");
  const medium = dimension(body?.medium, "none");
  const campaign = dimension(body?.campaign, "none");
  const key = [day, event, path, platform, source, medium, campaign].join("|");

  await database
    .prepare(`INSERT INTO promotion_metrics
      (key, day, event, path, platform, source, medium, campaign, count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(key) DO UPDATE SET count = count + 1, updated_at = excluded.updated_at`)
    .bind(key, day, event, path, platform, source, medium, campaign, now)
    .run();

  return new Response(null, {
    status: 202,
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
