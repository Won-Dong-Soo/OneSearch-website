import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const licenses = sqliteTable("licenses", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id").notNull(),
  customerId: text("customer_id"),
  keyHash: text("key_hash").notNull(),
  keyLast4: text("key_last4").notNull(),
  plan: text("plan").notNull().default("founding_pro"),
  status: text("status").notNull().default("active"),
  maxDevices: integer("max_devices").notNull().default(3),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("licenses_transaction_id_unique").on(table.transactionId),
  uniqueIndex("licenses_key_hash_unique").on(table.keyHash),
  index("licenses_status_idx").on(table.status),
]);

export const licenseActivations = sqliteTable("license_activations", {
  id: text("id").primaryKey(),
  licenseId: text("license_id").notNull().references(() => licenses.id, { onDelete: "cascade" }),
  deviceHash: text("device_hash").notNull(),
  platform: text("platform"),
  appVersion: text("app_version"),
  activatedAt: text("activated_at").notNull(),
  lastValidatedAt: text("last_validated_at").notNull(),
}, (table) => [
  uniqueIndex("license_activations_license_device_unique").on(table.licenseId, table.deviceHash),
  index("license_activations_license_idx").on(table.licenseId),
]);

export const paddleWebhookEvents = sqliteTable("paddle_webhook_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  occurredAt: text("occurred_at"),
  processedAt: text("processed_at").notNull(),
});

export const supportRequests = sqliteTable("support_requests", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  ipHash: text("ip_hash").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("support_requests_status_idx").on(table.status),
  index("support_requests_ip_created_idx").on(table.ipHash, table.createdAt),
]);

export const communityPosts = sqliteTable("community_posts", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorName: text("author_name").notNull(),
  authorSecretHash: text("author_secret_hash").notNull(),
  status: text("status").notNull().default("open"),
  ipHash: text("ip_hash").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("community_posts_type_created_idx").on(table.type, table.createdAt),
  index("community_posts_ip_created_idx").on(table.ipHash, table.createdAt),
  index("community_posts_status_idx").on(table.status),
]);

export const communityComments = sqliteTable("community_comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  authorName: text("author_name").notNull(),
  authorSecretHash: text("author_secret_hash").notNull(),
  ipHash: text("ip_hash").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("community_comments_post_created_idx").on(table.postId, table.createdAt),
  index("community_comments_ip_created_idx").on(table.ipHash, table.createdAt),
]);

export const promotionMetrics = sqliteTable("promotion_metrics", {
  key: text("key").primaryKey(),
  day: text("day").notNull(),
  event: text("event").notNull(),
  path: text("path").notNull(),
  platform: text("platform").notNull(),
  source: text("source").notNull(),
  medium: text("medium").notNull(),
  campaign: text("campaign").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  index("promotion_metrics_day_event_idx").on(table.day, table.event),
  index("promotion_metrics_source_campaign_idx").on(table.source, table.campaign),
]);
