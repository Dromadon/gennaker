import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, evaluationTemplates, questions, sections, templateSlots } from '../schema'
import type { EvaluationTemplate, Format, Support, TemplateSlot } from '$lib/domain/types'

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
			questionCount: templateSlots.questionCount,
			pinnedQuestionId: templateSlots.pinnedQuestionId,
			preferredQuestionIds: templateSlots.preferredQuestionIds
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
		slots: slotRows.map((s) => ({
			...s,
			preferredQuestionIds: JSON.parse(s.preferredQuestionIds) as number[]
		}))
	}
}

export type TemplateSlotWithResolved = TemplateSlot & {
	pinnedQuestionTitle: string | null
	pinnedQuestionAvailable: boolean
	preferredQuestions: { id: number; title: string; available: boolean }[]
}

export type TemplateWithSlots = {
	id: number
	supportSlug: string
	format: string
	slots: TemplateSlotWithResolved[]
}

export async function getAllTemplatesWithSlots(d1: D1Database): Promise<TemplateWithSlots[]> {
	const db = getDb(d1)

	const templateRows = await db
		.select({ id: evaluationTemplates.id, supportSlug: evaluationTemplates.supportSlug, format: evaluationTemplates.format })
		.from(evaluationTemplates)
		.orderBy(evaluationTemplates.supportSlug, evaluationTemplates.format)

	const result: TemplateWithSlots[] = []

	for (const t of templateRows) {
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
				questionCount: templateSlots.questionCount,
				pinnedQuestionId: templateSlots.pinnedQuestionId,
				preferredQuestionIds: templateSlots.preferredQuestionIds
			})
			.from(templateSlots)
			.innerJoin(sections, eq(sections.id, templateSlots.sectionId))
			.innerJoin(categories, eq(categories.id, sections.categoryId))
			.where(eq(templateSlots.templateId, t.id))
			.orderBy(templateSlots.position)

		const parsedSlots = slotRows.map((s) => ({
			...s,
			preferredQuestionIds: JSON.parse(s.preferredQuestionIds) as number[]
		}))

		// Batch-résoudre tous les IDs de questions référencés dans ce template
		const allIds = new Set<number>()
		for (const s of parsedSlots) {
			if (s.pinnedQuestionId !== null) allIds.add(s.pinnedQuestionId)
			for (const id of s.preferredQuestionIds) allIds.add(id)
		}

		const questionData = new Map<number, { title: string; available: boolean }>()
		if (allIds.size > 0) {
			const rows = await db
				.select({ id: questions.id, title: questions.title, status: questions.status })
				.from(questions)
				.where(inArray(questions.id, [...allIds]))
			for (const r of rows) questionData.set(r.id, { title: r.title, available: r.status === 'publie' })
		}

		result.push({
			...t,
			slots: parsedSlots.map((s) => {
				const pinnedData = s.pinnedQuestionId !== null ? questionData.get(s.pinnedQuestionId) : undefined
				return {
					...s,
					pinnedQuestionTitle: pinnedData?.title ?? null,
					pinnedQuestionAvailable: pinnedData?.available ?? false,
					preferredQuestions: s.preferredQuestionIds.map((id) => {
						const d = questionData.get(id)
						return { id, title: d?.title ?? `#${id}`, available: d?.available ?? false }
					})
				}
			})
		})
	}

	return result
}

export async function getTemplateSlotById(
	d1: D1Database,
	slotId: number
): Promise<{ id: number; templateId: number; pinnedQuestionId: number | null; preferredQuestionIds: number[] } | null> {
	const db = getDb(d1)
	const row = await db
		.select({
			id: templateSlots.id,
			templateId: templateSlots.templateId,
			pinnedQuestionId: templateSlots.pinnedQuestionId,
			preferredQuestionIds: templateSlots.preferredQuestionIds
		})
		.from(templateSlots)
		.where(eq(templateSlots.id, slotId))
		.get()

	if (!row) return null
	return { ...row, preferredQuestionIds: JSON.parse(row.preferredQuestionIds) as number[] }
}

export type SlotPatch = {
	pinnedQuestionId: number | null
	preferredQuestionIds: number[]
}

export async function updateTemplateSlot(d1: D1Database, slotId: number, patch: SlotPatch): Promise<void> {
	const db = getDb(d1)
	await db
		.update(templateSlots)
		.set({
			pinnedQuestionId: patch.pinnedQuestionId,
			preferredQuestionIds: JSON.stringify(patch.preferredQuestionIds)
		})
		.where(eq(templateSlots.id, slotId))
}
