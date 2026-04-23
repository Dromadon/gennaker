import { and, eq } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, evaluationTemplates, sections, templateSlots } from '../schema'
import type { EvaluationTemplate, Format, Support } from '$lib/domain/types'

export async function getTemplate(
	d1: D1Database,
	support: Support,
	format: Format
): Promise<EvaluationTemplate | null> {
	const db = getDb(d1)

	const templateRow = await db
		.select({ id: evaluationTemplates.id })
		.from(evaluationTemplates)
		.where(
			and(eq(evaluationTemplates.supportSlug, support), eq(evaluationTemplates.format, format))
		)
		.get()

	if (!templateRow) return null

	const slotRows = await db
		.select({
			id: templateSlots.id,
			sectionId: templateSlots.sectionId,
			categoryId: sections.categoryId,
			sectionDisplayName: sections.displayName,
			categoryDisplayName: categories.displayName,
			position: templateSlots.position,
			questionCount: templateSlots.questionCount
		})
		.from(templateSlots)
		.innerJoin(sections, eq(sections.id, templateSlots.sectionId))
		.innerJoin(categories, eq(categories.id, sections.categoryId))
		.where(eq(templateSlots.templateId, templateRow.id))
		.orderBy(templateSlots.position)

	return {
		id: templateRow.id,
		support,
		format,
		slots: slotRows
	}
}
