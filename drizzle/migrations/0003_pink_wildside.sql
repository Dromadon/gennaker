CREATE UNIQUE INDEX `evaluation_templates_support_format_unique` ON `evaluation_templates` (`support_slug`,`format`);--> statement-breakpoint
CREATE UNIQUE INDEX `sections_category_slug_unique` ON `sections` (`category_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `template_slots_template_position_unique` ON `template_slots` (`template_id`,`position`);