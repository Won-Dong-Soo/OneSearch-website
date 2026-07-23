let tableReady = false;

export async function ensurePromotionMetricsTable(database: D1Database) {
  if (tableReady) return;

  await database.prepare(`CREATE TABLE IF NOT EXISTS promotion_metrics (
    key text PRIMARY KEY NOT NULL,
    day text NOT NULL,
    event text NOT NULL,
    path text NOT NULL,
    platform text NOT NULL,
    source text NOT NULL,
    medium text NOT NULL,
    campaign text NOT NULL,
    count integer DEFAULT 0 NOT NULL,
    updated_at text NOT NULL
  )`).run();
  await database.prepare("CREATE INDEX IF NOT EXISTS promotion_metrics_day_event_idx ON promotion_metrics (day, event)").run();
  await database.prepare("CREATE INDEX IF NOT EXISTS promotion_metrics_source_campaign_idx ON promotion_metrics (source, campaign)").run();
  tableReady = true;
}
