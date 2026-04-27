import { and, count, eq, inArray, like, or, sql } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, questions, sections } from '../schema'
import type { Question, QuestionAdminDetail, QuestionListRow, Support } from '$lib/domain/types'

const PAGE_SIZE = 20

export type QuestionInput = {
	title: string
	sectionId: number
	questionMd: string
	correctionMd: string
	difficulty: 'facile' | 'moyen' | 'difficile'
	answerSize: 'xs' | 'sm' | 'md' | 'lg'
	applicableSupports: Support[]
	status: 'brouillon' | 'publie'
	sourceMd?: string | null
}

export type QuestionExportRow = {
	id: number
	categorySlug: string
	sectionSlug: string
	title: string
	questionMd: string
	correctionMd: string
}

export async function getAllQuestionsForExport(d1: D1Database): Promise<QuestionExportRow[]> {
	return getDb(d1)
		.select({
			id: questions.id,
			categorySlug: categories.slug,
			sectionSlug: sections.slug,
			title: questions.title,
			questionMd: questions.questionMd,
			correctionMd: questions.correctionMd
		})
		.from(questions)
		.innerJoin(sections, eq(sections.id, questions.sectionId))
		.innerJoin(categories, eq(categories.id, sections.categoryId))
		.where(eq(questions.status, 'publie'))
}

export async function getQuestionsAdmin(
	d1: D1Database,
	filters: {
		categoryId?: number | null
		sectionId?: number | null
		support?: string | null
		status?: string | null
		page: number
	}
): Promise<{ rows: QuestionListRow[]; total: number }> {
	const db = getDb(d1)

	const conditions = []
	if (filters.sectionId) conditions.push(eq(questions.sectionId, filters.sectionId))
	if (filters.categoryId) conditions.push(eq(sections.categoryId, filters.categoryId))
	if (filters.status) conditions.push(eq(questions.status, filters.status))
	if (filters.support) {
		conditions.push(
			or(
				eq(questions.applicableSupports, '[]'),
				like(questions.applicableSupports, `%"${filters.support}"%`)
			)!
		)
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const base = db
		.select({
			id: questions.id,
			title: questions.title,
			difficulty: questions.difficulty,
			status: questions.status,
			answerSize: questions.answerSize,
			applicableSupports: questions.applicableSupports,
			categoryDisplayName: categories.displayName,
			sectionDisplayName: sections.displayName,
			categorySlug: categories.slug,
			sectionSlug: sections.slug
		})
		.from(questions)
		.innerJoin(sections, eq(sections.id, questions.sectionId))
		.innerJoin(categories, eq(categories.id, sections.categoryId))

	const [rows, [{ total }]] = await Promise.all([
		base
			.where(where)
			.orderBy(categories.id, sections.id, questions.id)
			.limit(PAGE_SIZE)
			.offset((filters.page - 1) * PAGE_SIZE),
		db
			.select({ total: count() })
			.from(questions)
			.innerJoin(sections, eq(sections.id, questions.sectionId))
			.innerJoin(categories, eq(categories.id, sections.categoryId))
			.where(where)
	])

	return {
		rows: rows.map((r) => ({
			...r,
			difficulty: r.difficulty as QuestionListRow['difficulty'],
			status: r.status as QuestionListRow['status'],
			answerSize: r.answerSize as QuestionListRow['answerSize'],
			applicableSupports: JSON.parse(r.applicableSupports ?? '[]')
		})),
		total
	}
}

export async function getQuestionAdminById(
	d1: D1Database,
	id: number
): Promise<QuestionAdminDetail | null> {
	const rows = await getDb(d1)
		.select({
			id: questions.id,
			sectionId: questions.sectionId,
			title: questions.title,
			questionMd: questions.questionMd,
			correctionMd: questions.correctionMd,
			difficulty: questions.difficulty,
			status: questions.status,
			answerSize: questions.answerSize,
			applicableSupports: questions.applicableSupports,
			sourceMd: questions.sourceMd,
			categoryDisplayName: categories.displayName,
			sectionDisplayName: sections.displayName,
			categorySlug: categories.slug,
			sectionSlug: sections.slug
		})
		.from(questions)
		.innerJoin(sections, eq(sections.id, questions.sectionId))
		.innerJoin(categories, eq(categories.id, sections.categoryId))
		.where(eq(questions.id, id))
		.limit(1)

	if (rows.length === 0) return null
	const r = rows[0]
	return {
		...r,
		difficulty: r.difficulty as QuestionAdminDetail['difficulty'],
		status: r.status as QuestionAdminDetail['status'],
		answerSize: r.answerSize as QuestionAdminDetail['answerSize'],
		applicableSupports: JSON.parse(r.applicableSupports ?? '[]'),
		sourceMd: r.sourceMd ?? null
	}
}

export async function createQuestion(d1: D1Database, data: QuestionInput): Promise<number> {
	const now = Math.floor(Date.now() / 1000)
	const result = await getDb(d1)
		.insert(questions)
		.values({
			sectionId: data.sectionId,
			title: data.title,
			questionMd: data.questionMd,
			correctionMd: data.correctionMd,
			difficulty: data.difficulty,
			answerSize: data.answerSize,
			applicableSupports: JSON.stringify(data.applicableSupports),
			status: data.status,
			sourceMd: data.sourceMd ?? null,
			createdAt: now,
			updatedAt: now
		})
		.returning({ id: questions.id })
	return result[0].id
}

export async function updateQuestion(
	d1: D1Database,
	id: number,
	data: QuestionInput
): Promise<void> {
	await getDb(d1)
		.update(questions)
		.set({
			sectionId: data.sectionId,
			title: data.title,
			questionMd: data.questionMd,
			correctionMd: data.correctionMd,
			difficulty: data.difficulty,
			answerSize: data.answerSize,
			applicableSupports: JSON.stringify(data.applicableSupports),
			status: data.status,
			sourceMd: data.sourceMd ?? null,
			updatedAt: Math.floor(Date.now() / 1000)
		})
		.where(eq(questions.id, id))
}

export async function deleteQuestion(d1: D1Database, id: number): Promise<void> {
	await getDb(d1).delete(questions).where(eq(questions.id, id))
}

export async function getQuestionsBySection(
	d1: D1Database,
	sectionIds: number[]
): Promise<Record<number, Question[]>> {
	if (sectionIds.length === 0) return {}

	const rows = await getDb(d1)
		.select({
			id: questions.id,
			sectionId: questions.sectionId,
			title: questions.title,
			questionMd: questions.questionMd,
			correctionMd: questions.correctionMd,
			applicableSupports: questions.applicableSupports,
			answerSize: questions.answerSize
		})
		.from(questions)
		.where(and(inArray(questions.sectionId, sectionIds), eq(questions.status, 'publie')))

	const result: Record<number, Question[]> = {}
	for (const row of rows) {
		const q: Question = {
			...row,
			applicableSupports: JSON.parse(row.applicableSupports ?? '[]'),
			answerSize: (row.answerSize ?? 'md') as Question['answerSize']
		}
		;(result[q.sectionId] ??= []).push(q)
	}
	return result
}
