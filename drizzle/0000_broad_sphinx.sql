CREATE TABLE `license_activations` (
	`id` text PRIMARY KEY NOT NULL,
	`license_id` text NOT NULL,
	`device_hash` text NOT NULL,
	`platform` text,
	`app_version` text,
	`activated_at` text NOT NULL,
	`last_validated_at` text NOT NULL,
	FOREIGN KEY (`license_id`) REFERENCES `licenses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `license_activations_license_device_unique` ON `license_activations` (`license_id`,`device_hash`);--> statement-breakpoint
CREATE INDEX `license_activations_license_idx` ON `license_activations` (`license_id`);--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`customer_id` text,
	`key_hash` text NOT NULL,
	`key_last4` text NOT NULL,
	`plan` text DEFAULT 'founding_pro' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`max_devices` integer DEFAULT 3 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `licenses_transaction_id_unique` ON `licenses` (`transaction_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `licenses_key_hash_unique` ON `licenses` (`key_hash`);--> statement-breakpoint
CREATE INDEX `licenses_status_idx` ON `licenses` (`status`);--> statement-breakpoint
CREATE TABLE `paddle_webhook_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`occurred_at` text,
	`processed_at` text NOT NULL
);
