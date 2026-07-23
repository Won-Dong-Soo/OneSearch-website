import { adminRequestAuthorized } from "../../../../../db/admin-request";
import { requireDatabase } from "../../../../../db/license-store";
import { ensurePromotionMetricsTable } from "../../../../../db/promotion-store";

export async function GET(request: Request) {
  if (!await adminRequestAuthorized(request)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const database = requireDatabase();
  await ensurePromotionMetricsTable(database);
  const rows = await database
    .prepare(`SELECT day, event, path, platform, source, medium, campaign, count
      FROM promotion_metrics
      WHERE day >= ? AND path NOT LIKE '/admin%'
      ORDER BY day DESC, count DESC LIMIT 1000`)
    .bind(since)
    .all();

  return Response.json({ since, metrics: rows.results }, {
    headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" },
  });
}
