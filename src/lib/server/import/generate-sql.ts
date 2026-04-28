import type { TemplateExportRow } from '$lib/server/db/queries/templates'
import type { ParsedQuestion, StructureJson } from './parse-zip'

function escape(s: string): string {
	return s.replace(/'/g, "''")
}

export function generateStructureSql(structure: StructureJson): string {
	const lines: string[] = []
	const now = Math.floor(Date.now() / 1000)

	for (const s of structure.supports) {
		lines.push(
			`INSERT INTO supports (slug, display_name, enabled) VALUES ('${escape(s.slug)}', '${escape(s.displayName)}', ${s.enabled ? 1 : 0})` +
			` ON CONFLICT(slug) DO UPDATE SET display_name=excluded.display_name, enabled=excluded.enabled;`
		)
	}

	for (const cat of structure.categories) {
		const supportsJson = escape(JSON.stringify(cat.applicableSupports))
		lines.push(
			`INSERT INTO categories (slug, display_name, applicable_supports) VALUES ('${escape(cat.slug)}', '${escape(cat.displayName)}', '${supportsJson}')` +
			` ON CONFLICT(slug) DO UPDATE SET display_name=excluded.display_name, applicable_supports=excluded.applicable_supports;`
		)
		for (const sec of cat.sections) {
			const secSupportsJson = escape(JSON.stringify(sec.applicableSupports))
			lines.push(
				`INSERT INTO sections (category_id, slug, display_name, applicable_supports)` +
				` VALUES ((SELECT id FROM categories WHERE slug='${escape(cat.slug)}'), '${escape(sec.slug)}', '${escape(sec.displayName)}', '${secSupportsJson}')` +
				` ON CONFLICT(category_id, slug) DO UPDATE SET display_name=excluded.display_name, applicable_supports=excluded.applicable_supports;`
			)
		}
	}

	return lines.join('\n')
}

export function generateQuestionsSql(questions: ParsedQuestion[]): string {
	const lines: string[] = []
	const now = Math.floor(Date.now() / 1000)

	for (const q of questions) {
		const sourcePart = q.sourceMd ? `'${escape(q.sourceMd)}'` : 'NULL'
		lines.push(
			`INSERT INTO questions (id, section_id, title, question_md, correction_md, difficulty, answer_size, applicable_supports, status, source_md, created_at, updated_at)` +
			` VALUES (${q.id}, (SELECT id FROM sections WHERE slug='${escape(q.sectionSlug)}'), '${escape(q.title)}', '${escape(q.questionMd)}', '${escape(q.correctionMd)}', 'moyen', 'md', '[]', 'publie', ${sourcePart}, ${now}, ${now})` +
			` ON CONFLICT(id) DO UPDATE SET section_id=excluded.section_id, title=excluded.title, question_md=excluded.question_md, correction_md=excluded.correction_md, source_md=excluded.source_md, updated_at=excluded.updated_at;`
		)
	}

	return lines.join('\n')
}

export function generateTemplatesSql(templates: TemplateExportRow[]): string {
	const lines: string[] = []
	const now = Math.floor(Date.now() / 1000)

	for (const t of templates) {
		lines.push(
			`INSERT INTO evaluation_templates (support_slug, format, created_at, updated_at)` +
			` VALUES ('${escape(t.supportSlug)}', '${escape(t.format)}', ${now}, ${now})` +
			` ON CONFLICT(support_slug, format) DO UPDATE SET updated_at=excluded.updated_at;`
		)
		for (const slot of t.slots) {
			const pinnedPart = slot.pinnedQuestionId ? String(slot.pinnedQuestionId) : 'NULL'
			const preferredJson = escape(slot.preferredQuestionIds ?? '[]')
			lines.push(
				`INSERT INTO template_slots (template_id, section_id, position, question_count, difficulty_filter, pinned_question_id, preferred_question_ids)` +
				` VALUES (` +
				`(SELECT id FROM evaluation_templates WHERE support_slug='${escape(t.supportSlug)}' AND format='${escape(t.format)}'),` +
				`(SELECT id FROM sections WHERE slug='${escape(slot.sectionSlug)}'),` +
				`${slot.position}, ${slot.questionCount}, '${escape(slot.difficultyFilter)}', ${pinnedPart}, '${preferredJson}')` +
				` ON CONFLICT(template_id, position) DO UPDATE SET section_id=excluded.section_id, question_count=excluded.question_count, difficulty_filter=excluded.difficulty_filter, pinned_question_id=excluded.pinned_question_id, preferred_question_ids=excluded.preferred_question_ids;`
			)
		}
	}

	return lines.join('\n')
}
