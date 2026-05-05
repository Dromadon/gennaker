CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_id` integer REFERENCES `admins`(`id`) ON DELETE SET NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` integer,
	`metadata` text DEFAULT '{}' NOT NULL,
	`ip_address` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_admin_id_idx` ON `audit_logs` (`admin_id`);
--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);
