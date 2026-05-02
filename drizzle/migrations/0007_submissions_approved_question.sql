ALTER TABLE `community_submissions` ADD COLUMN `approved_question_id` integer REFERENCES `questions`(`id`);
