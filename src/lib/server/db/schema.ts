import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const supports = sqliteTable('supports', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	displayName: text('display_name').notNull(),
	enabled: integer('enabled').notNull().default(1)
});

export const categories = sqliteTable('categories', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	displayName: text('display_name').notNull(),
	// JSON stringifié : '[]' = tous les supports
	applicableSupports: text('applicable_supports').notNull().default('[]')
});

export const sections = sqliteTable('sections', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	categoryId: integer('category_id')
		.notNull()
		.references(() => categories.id),
	slug: text('slug').notNull(),
	displayName: text('display_name').notNull(),
	// JSON stringifié : '[]' = tous les supports
	applicableSupports: text('applicable_supports').notNull().default('[]')
});

export const questions = sqliteTable('questions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	sectionId: integer('section_id')
		.notNull()
		.references(() => sections.id),
	title: text('title').notNull(),
	questionMd: text('question_md').notNull(),
	correctionMd: text('correction_md').notNull(),
	difficulty: text('difficulty').notNull().default('moyen'), // 'facile' | 'moyen' | 'difficile'
	answerSize: text('answer_size').notNull().default('md'), // 'xs' | 'sm' | 'md' | 'lg'
	// JSON stringifié : '[]' = tous les supports
	applicableSupports: text('applicable_supports').notNull().default('[]'),
	status: text('status').notNull().default('brouillon'), // 'brouillon' | 'publie'
	sourceMd: text('source_md'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const questionImages = sqliteTable('question_images', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	questionId: integer('question_id')
		.notNull()
		.references(() => questions.id),
	filename: text('filename').notNull(),
	storageUrl: text('storage_url').notNull()
});

export const evaluationTemplates = sqliteTable('evaluation_templates', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	supportSlug: text('support_slug')
		.notNull()
		.references(() => supports.slug),
	format: text('format').notNull(), // 'standard' | 'raccourcie' | 'positionnement'
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const templateSlots = sqliteTable('template_slots', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	templateId: integer('template_id')
		.notNull()
		.references(() => evaluationTemplates.id),
	sectionId: integer('section_id')
		.notNull()
		.references(() => sections.id),
	position: integer('position').notNull(),
	questionCount: integer('question_count').notNull(),
	difficultyFilter: text('difficulty_filter').notNull().default('any'), // 'any' | 'facile' | 'moyen' | 'difficile'
	pinnedQuestionId: integer('pinned_question_id').references(() => questions.id),
	// JSON stringifié : '[42, 17]'
	preferredQuestionIds: text('preferred_question_ids').notNull().default('[]')
});

export const sharedEvaluations = sqliteTable('shared_evaluations', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	shortCode: text('short_code').notNull().unique(),
	supportSlug: text('support_slug').notNull(),
	format: text('format').notNull(),
	// JSON stringifié : [{section_id, question_ids[], pinned_ids[]}]
	slotsJson: text('slots_json').notNull(),
	createdAt: integer('created_at').notNull(),
	expiresAt: integer('expires_at').notNull()
});

export const communitySubmissions = sqliteTable('community_submissions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	type: text('type').notNull(), // 'nouvelle_question' | 'correction'
	sectionId: integer('section_id').references(() => sections.id),
	questionId: integer('question_id').references(() => questions.id),
	title: text('title'),
	questionMd: text('question_md'),
	correctionMd: text('correction_md'),
	sourceMd: text('source_md'),
	problemDescription: text('problem_description'),
	submitterEmail: text('submitter_email'),
	status: text('status').notNull().default('en_attente'), // 'en_attente' | 'approuve' | 'rejete'
	createdAt: integer('created_at').notNull(),
	reviewedAt: integer('reviewed_at')
});
