CREATE TABLE `support_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`subject` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `support_requests_status_idx` ON `support_requests` (`status`);--> statement-breakpoint
CREATE INDEX `support_requests_ip_created_idx` ON `support_requests` (`ip_hash`,`created_at`);