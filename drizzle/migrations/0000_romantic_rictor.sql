CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`applicable_supports` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `community_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`section_id` integer,
	`question_id` integer,
	`title` text,
	`question_md` text,
	`correction_md` text,
	`source_md` text,
	`problem_description` text,
	`submitter_email` text,
	`status` text DEFAULT 'en_attente' NOT NULL,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evaluation_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`support_slug` text NOT NULL,
	`format` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`support_slug`) REFERENCES `supports`(`slug`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `question_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`filename` text NOT NULL,
	`storage_url` text NOT NULL,
	`in_correction` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` integer NOT NULL,
	`title` text NOT NULL,
	`question_md` text NOT NULL,
	`correction_md` text NOT NULL,
	`difficulty` text DEFAULT 'moyen' NOT NULL,
	`answer_size` text DEFAULT 'md' NOT NULL,
	`applicable_supports` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'brouillon' NOT NULL,
	`source_md` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`applicable_supports` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `shared_evaluations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`short_code` text NOT NULL,
	`support_slug` text NOT NULL,
	`format` text NOT NULL,
	`slots_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shared_evaluations_short_code_unique` ON `shared_evaluations` (`short_code`);--> statement-breakpoint
CREATE TABLE `supports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`display_name` text NOT NULL,
	`enabled` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `supports_slug_unique` ON `supports` (`slug`);--> statement-breakpoint
CREATE TABLE `template_slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`template_id` integer NOT NULL,
	`section_id` integer NOT NULL,
	`position` integer NOT NULL,
	`question_count` integer NOT NULL,
	`difficulty_filter` text DEFAULT 'any' NOT NULL,
	`pinned_question_id` integer,
	`preferred_question_ids` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`template_id`) REFERENCES `evaluation_templates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pinned_question_id`) REFERENCES `questions`(`id`) ON UPDATE no action ON DELETE no action
);
