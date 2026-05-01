DROP TABLE `community_submissions`;
--> statement-breakpoint
CREATE TABLE `community_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`section_id` integer NOT NULL,
	`title` text NOT NULL,
	`question_md` text NOT NULL,
	`correction_md` text NOT NULL,
	`applicable_supports` text NOT NULL,
	`submitter_name` text NOT NULL,
	`submitter_email` text NOT NULL,
	`status` text DEFAULT 'en_attente' NOT NULL,
	`rejection_note` text,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	FOREIGN KEY (`section_id`) REFERENCES `sections`(`id`) ON UPDATE no action ON DELETE no action
);
