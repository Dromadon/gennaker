import { and, eq } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, evaluationTemplates, sections, templateSlots } from '../schema'
import type { EvaluationTemplate, Format, Support } from '$lib/domain/types'

export type TemplateExportRow = {
	id: number
	supportSlug: string
	format: string
	slots: {
		id: number
		categorySlug: string
		sectionSlug: string
		position: number
		questionCount: number
		pinnedQuestionId: number | null
		preferredQuestionIds: string
	}[]
}

export async function getAllTemplatesForExport(d1: D1Database): Promise<TemplateExportRow[]> {
	const db = getDb(d1)

	const templateRows = await db
		.select({ id: evaluationTemplates.id, supportSlug: evaluationTemplates.supportSlug, format: evaluationTemplates.format })
		.from(evaluationTemplates)

	const result: TemplateExportRow[] = []
	for (const t of templateRows) {
		const slots = await db
			.select({
				id: templateSlots.id,
				categorySlug: categories.slug,
				sectionSlug: sections.slug,
				position: templateSlots.position,
				questionCount: templateSlots.questionCount,
				pinnedQuestionId: templateSlots.pinnedQuestionId,
				preferredQuestionIds: templateSlots.preferredQuestionIds
			})
			.from(templateSlots)
			.innerJoin(sections, eq(sections.id, templateSlots.sectionId))
			.innerJoin(categories, eq(categories.id, sections.categoryId))
			.where(eq(templateSlots.templateId, t.id))
			.orderBy(templateSlots.position)
		result.push({ ...t, slots })
	}
	return result
}

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
			categorySlug: categories.slug,
			sectionSlug: sections.slug,
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
