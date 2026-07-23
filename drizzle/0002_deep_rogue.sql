CREATE TABLE `community_comments` (
	`id` text PRIMARY KEY NOT NULL,
	`post_id` text NOT NULL,
	`body` text NOT NULL,
	`author_name` text NOT NULL,
	`author_secret_hash` text NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`post_id`) REFERENCES `community_posts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_comments_post_created_idx` ON `community_comments` (`post_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `community_comments_ip_created_idx` ON `community_comments` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `community_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`author_name` text NOT NULL,
	`author_secret_hash` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`ip_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `community_posts_type_created_idx` ON `community_posts` (`type`,`created_at`);--> statement-breakpoint
CREATE INDEX `community_posts_ip_created_idx` ON `community_posts` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `community_posts_status_idx` ON `community_posts` (`status`);