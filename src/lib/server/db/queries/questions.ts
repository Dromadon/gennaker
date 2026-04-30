import { and, count, eq, inArray, like, or, sql } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, questions, sections, supports } from '../schema'
import type { Question, QuestionAdminDetail, QuestionAdminListRow, QuestionListRow, Support } from '$lib/domain/types'

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
	difficulty: 'facile' | 'moyen' | 'difficile'
	answerSize: 'xs' | 'sm' | 'md' | 'lg'
	applicableSupports: Support[]
	sourceMd: string | null
}

export type StructureExportRow = {
	supports: { slug: string; displayName: string; enabled: boolean }[]
	categories: {
		slug: string
		displayName: string
		applicableSupports: string[]
		sections: {
			slug: string
			displayName: string
			applicableSupports: string[]
		}[]
	}[]
}

export async function getAllQuestionsForExport(d1: D1Database): Promise<QuestionExportRow[]> {
	const rows = await getDb(d1)
		.select({
			id: questions.id,
			categorySlug: categories.slug,
			sectionSlug: sections.slug,
			title: questions.title,
			questionMd: questions.questionMd,
			correctionMd: questions.correctionMd,
			difficulty: questions.difficulty,
			answerSize: questions.answerSize,
			applicableSupports: questions.applicableSupports,
			sourceMd: questions.sourceMd
		})
		.from(questions)
		.innerJoin(sections, eq(sections.id, questions.sectionId))
		.innerJoin(categories, eq(categories.id, sections.categoryId))
		.where(eq(questions.status, 'publie'))
	return rows.map((r) => ({
		...r,
		difficulty: r.difficulty as QuestionExportRow['difficulty'],
		answerSize: r.answerSize as QuestionExportRow['answerSize'],
		applicableSupports: JSON.parse(r.applicableSupports ?? '[]') as Support[]
	}))
}

export async function getStructureForExport(d1: D1Database): Promise<StructureExportRow> {
	const db = getDb(d1)

	const [supportRows, categoryRows] = await Promise.all([
		db.select({ slug: supports.slug, displayName: supports.displayName, enabled: supports.enabled }).from(supports),
		db.select({ id: categories.id, slug: categories.slug, displayName: categories.displayName, applicableSupports: categories.applicableSupports }).from(categories)
	])

	const structureCategories = []

	for (const cat of categoryRows) {
		const sectionRows = await db
			.select({
				slug: sections.slug,
				displayName: sections.displayName,
				applicableSupports: sections.applicableSupports
			})
			.from(sections)
			.where(eq(sections.categoryId, cat.id))

		structureCategories.push({
			slug: cat.slug,
			displayName: cat.displayName,
			applicableSupports: JSON.parse(cat.applicableSupports),
			sections: sectionRows.map((s) => ({
				slug: s.slug,
				displayName: s.displayName,
				applicableSupports: JSON.parse(s.applicableSupports)
			}))
		})
	}

	return {
		supports: supportRows.map((s) => ({ slug: s.slug, displayName: s.displayName, enabled: Boolean(s.enabled) })),
		categories: structureCategories
	}
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
): Promise<{ rows: QuestionAdminListRow[]; total: number }> {
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
			sectionSlug: sections.slug,
			questionMd: questions.questionMd,
			correctionMd: questions.correctionMd,
			sourceMd: questions.sourceMd
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
			difficulty: r.difficulty as QuestionAdminListRow['difficulty'],
			status: r.status as QuestionAdminListRow['status'],
			answerSize: r.answerSize as QuestionAdminListRow['answerSize'],
			applicableSupports: JSON.parse(r.applicableSupports ?? '[]'),
			sourceMd: r.sourceMd ?? null
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

export type QuestionPublicRow = QuestionListRow & {
	questionMd: string
	correctionMd: string
	sourceMd: string | null
}

export async function getQuestionsPublic(
	d1: D1Database,
	filters: {
		categoryId?: number | null
		sectionId?: number | null
		support?: string | null
		page: number
	}
): Promise<{ rows: QuestionPublicRow[]; total: number }> {
	const db = getDb(d1)

	const conditions = [eq(questions.status, 'publie')]
	if (filters.sectionId) conditions.push(eq(questions.sectionId, filters.sectionId))
	if (filters.categoryId) conditions.push(eq(sections.categoryId, filters.categoryId))
	if (filters.support) {
		conditions.push(
			or(
				eq(questions.applicableSupports, '[]'),
				like(questions.applicableSupports, `%"${filters.support}"%`)
			)!
		)
	}

	const where = and(...conditions)

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
			sectionSlug: sections.slug,
			questionMd: questions.questionMd,
			correctionMd: questions.correctionMd,
			sourceMd: questions.sourceMd
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
			difficulty: r.difficulty as QuestionPublicRow['difficulty'],
			status: r.status as QuestionPublicRow['status'],
			answerSize: r.answerSize as QuestionPublicRow['answerSize'],
			applicableSupports: JSON.parse(r.applicableSupports ?? '[]'),
			sourceMd: r.sourceMd ?? null
		})),
		total
	}
}

export type QuestionCandidateRow = {
	id: number
	sectionId: number
	title: string
	difficulty: 'facile' | 'moyen' | 'difficile'
	applicableSupports: string[]
	questionMd: string
	correctionMd: string
	answerSize: string
}

export async function getQuestionCandidates(
	d1: D1Database,
	sectionId: number
): Promise<QuestionCandidateRow[]> {
	const rows = await getDb(d1)
		.select({
			id: questions.id,
			sectionId: questions.sectionId,
			title: questions.title,
			difficulty: questions.difficulty,
			applicableSupports: questions.applicableSupports,
			questionMd: questions.questionMd,
			correctionMd: questions.correctionMd,
			answerSize: questions.answerSize
		})
		.from(questions)
		.where(and(eq(questions.sectionId, sectionId), eq(questions.status, 'publie')))

	return rows.map((r) => ({
		...r,
		difficulty: r.difficulty as QuestionCandidateRow['difficulty'],
		applicableSupports: JSON.parse(r.applicableSupports ?? '[]')
	}))
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

export async function getQuestionById(
	d1: D1Database,
	id: number
): Promise<{ id: number; title: string } | null> {
	const result = await getDb(d1)
		.select({ id: questions.id, title: questions.title })
		.from(questions)
		.where(eq(questions.id, id))
		.limit(1)
	return result[0] ?? null
}
