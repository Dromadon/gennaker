import { count, eq, inArray } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, questionReports, questions, sections } from '../schema'

const PAGE_SIZE = 30

export type ProblemType =
	| 'enonce_incorrect'
	| 'correction_incorrecte'
	| 'question_doublon'
	| 'mise_en_forme'
	| 'autre'

export type ReportStatus = 'nouveau' | 'resolu'

export type ReportAdminRow = {
	id: number
	questionId: number
	questionTitle: string
	questionMd: string
	correctionMd: string
	sourceMd: string | null
	categoryDisplayName: string
	sectionDisplayName: string
	difficulty: string
	applicableSupports: string
	problemType: ProblemType
	description: string | null
	email: string | null
	status: ReportStatus
	createdAt: number
}

export type QuestionReportSummary = {
	id: number
	questionId: number
	problemType: ProblemType
	description: string | null
	email: string | null
	status: ReportStatus
	createdAt: number
}

export type ReportInput = {
	questionId: number
	problemType: ProblemType
	description: string
	email: string | null
}

export async function getReportsByQuestionIds(
	d1: D1Database,
	questionIds: number[]
): Promise<QuestionReportSummary[]> {
	if (questionIds.length === 0) return []
	const rows = await getDb(d1)
		.select({
			id: questionReports.id,
			questionId: questionReports.questionId,
			problemType: questionReports.problemType,
			description: questionReports.description,
			email: questionReports.email,
			status: questionReports.status,
			createdAt: questionReports.createdAt
		})
		.from(questionReports)
		.where(inArray(questionReports.questionId, questionIds))
		.orderBy(questionReports.createdAt)
	return rows.map((r) => ({
		...r,
		problemType: r.problemType as ProblemType,
		status: r.status as ReportStatus
	}))
}

export async function createReport(d1: D1Database, data: ReportInput): Promise<number> {
	const db = getDb(d1)
	const result = await db
		.insert(questionReports)
		.values({
			questionId: data.questionId,
			problemType: data.problemType,
			description: data.description,
			email: data.email,
			status: 'nouveau',
			createdAt: Math.floor(Date.now() / 1000)
		})
		.returning({ id: questionReports.id })
	return result[0].id
}

export async function getReportsAdmin(
	d1: D1Database,
	filters: { status?: string | null; page: number }
): Promise<{ rows: ReportAdminRow[]; total: number }> {
	const db = getDb(d1)
	const offset = (filters.page - 1) * PAGE_SIZE

	const where = filters.status ? eq(questionReports.status, filters.status) : undefined

	const [rows, totalResult] = await Promise.all([
		db
			.select({
				id: questionReports.id,
				questionId: questionReports.questionId,
				questionTitle: questions.title,
				questionMd: questions.questionMd,
				correctionMd: questions.correctionMd,
				sourceMd: questions.sourceMd,
				categoryDisplayName: categories.displayName,
				sectionDisplayName: sections.displayName,
				difficulty: questions.difficulty,
				applicableSupports: questions.applicableSupports,
				problemType: questionReports.problemType,
				description: questionReports.description,
				email: questionReports.email,
				status: questionReports.status,
				createdAt: questionReports.createdAt
			})
			.from(questionReports)
			.innerJoin(questions, eq(questions.id, questionReports.questionId))
			.innerJoin(sections, eq(sections.id, questions.sectionId))
			.innerJoin(categories, eq(categories.id, sections.categoryId))
			.where(where)
			.orderBy(questionReports.createdAt)
			.limit(PAGE_SIZE)
			.offset(offset),
		db.select({ total: count() }).from(questionReports).where(where)
	])

	return {
		rows: rows.map((r) => ({
			...r,
			problemType: r.problemType as ProblemType,
			status: r.status as ReportStatus
		})),
		total: totalResult[0].total
	}
}

export async function countPendingReports(d1: D1Database): Promise<number> {
	const db = getDb(d1)
	const result = await db
		.select({ total: count() })
		.from(questionReports)
		.where(eq(questionReports.status, 'nouveau'))
	return result[0].total
}

export async function updateReportStatus(
	d1: D1Database,
	id: number,
	status: ReportStatus
): Promise<void> {
	await getDb(d1).update(questionReports).set({ status }).where(eq(questionReports.id, id))
}
