CREATE TABLE `promotion_metrics` (
	`key` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`event` text NOT NULL,
	`path` text NOT NULL,
	`platform` text NOT NULL,
	`source` text NOT NULL,
	`medium` text NOT NULL,
	`campaign` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `promotion_metrics_day_event_idx` ON `promotion_metrics` (`day`,`event`);--> statement-breakpoint
CREATE INDEX `promotion_metrics_source_campaign_idx` ON `promotion_metrics` (`source`,`campaign`);