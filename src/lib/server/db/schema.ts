import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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
}, (t) => [uniqueIndex('sections_category_slug_unique').on(t.categoryId, t.slug)]);

export const questions = sqliteTable('questions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	sectionId: integer('section_id')
		.notNull()
		.references(() => sections.id),
	title: text('title').notNull(),
	questionMd: text('question_md').notNull(),
	correctionMd: text('correction_md').notNull(),
	difficulty: text('difficulty').notNull().default('moyen'), // 'facile' | 'moyen' | 'difficile'
	answerSize: text('answer_size').notNull().default('md'), // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	// JSON stringifié : '[]' = tous les supports
	applicableSupports: text('applicable_supports').notNull().default('[]'),
	status: text('status').notNull().default('brouillon'), // 'brouillon' | 'publie'
	sourceMd: text('source_md'),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
});

export const evaluationTemplates = sqliteTable('evaluation_templates', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	supportSlug: text('support_slug')
		.notNull()
		.references(() => supports.slug),
	format: text('format').notNull(), // 'standard' | 'raccourcie' | 'positionnement'
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull()
}, (t) => [uniqueIndex('evaluation_templates_support_format_unique').on(t.supportSlug, t.format)]);

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
}, (t) => [uniqueIndex('template_slots_template_position_unique').on(t.templateId, t.position)]);

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

export const questionReports = sqliteTable('question_reports', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	questionId: integer('question_id').notNull().references(() => questions.id),
	problemType: text('problem_type').notNull(),
	// 'enonce_incorrect' | 'correction_incorrecte' | 'question_doublon' | 'mise_en_forme' | 'autre'
	description: text('description'), // max 500 chars, obligatoire
	email: text('email'), // contact email, optionnel
	status: text('status').notNull().default('nouveau'),
	// 'nouveau' | 'resolu'
	createdAt: integer('created_at').notNull()
});

export const admins = sqliteTable('admins', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	passwordHash: text('password_hash').notNull(),
	role: text('role').notNull().default('admin').$type<'admin' | 'super_admin'>(),
	createdAt: integer('created_at').notNull(),
	updatedAt: integer('updated_at').notNull(),
	lastLoginAt: integer('last_login_at'),
	mustChangePassword: integer('must_change_password').notNull().default(0)
});

export const auditLogs = sqliteTable('audit_logs', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	adminId: integer('admin_id').references(() => admins.id, { onDelete: 'set null' }),
	action: text('action').notNull(),
	targetType: text('target_type').notNull(), // 'question' | 'submission' | 'report'
	targetId: integer('target_id'),
	metadata: text('metadata').notNull().default('{}'), // JSON : { before, after } ou { context }
	ipAddress: text('ip_address'),
	createdAt: integer('created_at').notNull()
});

export const communitySubmissions = sqliteTable('community_submissions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	sectionId: integer('section_id').notNull().references(() => sections.id),
	title: text('title').notNull(),
	questionMd: text('question_md').notNull(),
	correctionMd: text('correction_md').notNull(),
	// JSON stringifié : '["deriveur","catamaran"]'
	applicableSupports: text('applicable_supports').notNull(),
	submitterName: text('submitter_name').notNull(),
	submitterEmail: text('submitter_email').notNull(),
	status: text('status').notNull().default('en_attente'), // 'en_attente' | 'approuve' | 'rejete'
	rejectionNote: text('rejection_note'),
	approvedQuestionId: integer('approved_question_id').references(() => questions.id),
	createdAt: integer('created_at').notNull(),
	reviewedAt: integer('reviewed_at')
});
