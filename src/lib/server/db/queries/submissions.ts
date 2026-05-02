import { count, desc, eq } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, communitySubmissions, sections } from '../schema'
import { createQuestion } from './questions'

export type SubmissionInput = {
	sectionId: number
	title: string
	questionMd: string
	correctionMd: string
	applicableSupports: string[]
	submitterName: string
	submitterEmail: string
}

export async function createCommunitySubmission(
	d1: D1Database,
	data: SubmissionInput
): Promise<number> {
	const db = getDb(d1)
	const result = await db
		.insert(communitySubmissions)
		.values({
			sectionId: data.sectionId,
			title: data.title,
			questionMd: data.questionMd,
			correctionMd: data.correctionMd,
			applicableSupports: JSON.stringify(data.applicableSupports),
			submitterName: data.submitterName,
			submitterEmail: data.submitterEmail,
			status: 'en_attente',
			createdAt: Math.floor(Date.now() / 1000)
		})
		.returning({ id: communitySubmissions.id })
	return result[0].id
}

const PAGE_SIZE = 20

export type SubmissionStatus = 'en_attente' | 'approuve' | 'rejete'

export type SubmissionAdminRow = {
	id: number
	title: string
	questionMd: string
	correctionMd: string
	applicableSupports: string
	submitterName: string
	submitterEmail: string
	sectionId: number
	sectionDisplayName: string
	categoryDisplayName: string
	status: SubmissionStatus
	rejectionNote: string | null
	approvedQuestionId: number | null
	createdAt: number
}

export type SubmissionDetail = SubmissionAdminRow

export async function getSubmissionsAdmin(
	d1: D1Database,
	filters: { status?: string | null; page: number }
): Promise<{ rows: SubmissionAdminRow[]; total: number }> {
	const db = getDb(d1)
	const offset = (filters.page - 1) * PAGE_SIZE

	const where = filters.status ? eq(communitySubmissions.status, filters.status) : undefined

	const [rows, totalResult] = await Promise.all([
		db
			.select({
				id: communitySubmissions.id,
				title: communitySubmissions.title,
				questionMd: communitySubmissions.questionMd,
				correctionMd: communitySubmissions.correctionMd,
				applicableSupports: communitySubmissions.applicableSupports,
				submitterName: communitySubmissions.submitterName,
				submitterEmail: communitySubmissions.submitterEmail,
				sectionId: communitySubmissions.sectionId,
				sectionDisplayName: sections.displayName,
				categoryDisplayName: categories.displayName,
				status: communitySubmissions.status,
				rejectionNote: communitySubmissions.rejectionNote,
				approvedQuestionId: communitySubmissions.approvedQuestionId,
				createdAt: communitySubmissions.createdAt
			})
			.from(communitySubmissions)
			.innerJoin(sections, eq(sections.id, communitySubmissions.sectionId))
			.innerJoin(categories, eq(categories.id, sections.categoryId))
			.where(where)
			.orderBy(desc(communitySubmissions.createdAt))
			.limit(PAGE_SIZE)
			.offset(offset),
		db.select({ total: count() }).from(communitySubmissions).where(where)
	])

	return {
		rows: rows.map((r) => ({ ...r, status: r.status as SubmissionStatus })),
		total: totalResult[0].total
	}
}

export async function getSubmissionById(
	d1: D1Database,
	id: number
): Promise<SubmissionDetail | null> {
	const db = getDb(d1)
	const rows = await db
		.select({
			id: communitySubmissions.id,
			title: communitySubmissions.title,
			questionMd: communitySubmissions.questionMd,
			correctionMd: communitySubmissions.correctionMd,
			applicableSupports: communitySubmissions.applicableSupports,
			submitterName: communitySubmissions.submitterName,
			submitterEmail: communitySubmissions.submitterEmail,
			sectionId: communitySubmissions.sectionId,
			sectionDisplayName: sections.displayName,
			categoryDisplayName: categories.displayName,
			status: communitySubmissions.status,
			rejectionNote: communitySubmissions.rejectionNote,
			approvedQuestionId: communitySubmissions.approvedQuestionId,
			createdAt: communitySubmissions.createdAt
		})
		.from(communitySubmissions)
		.innerJoin(sections, eq(sections.id, communitySubmissions.sectionId))
		.innerJoin(categories, eq(categories.id, sections.categoryId))
		.where(eq(communitySubmissions.id, id))
		.limit(1)

	if (rows.length === 0) return null
	return { ...rows[0], status: rows[0].status as SubmissionStatus }
}

export async function countPendingSubmissions(d1: D1Database): Promise<number> {
	const db = getDb(d1)
	const result = await db
		.select({ total: count() })
		.from(communitySubmissions)
		.where(eq(communitySubmissions.status, 'en_attente'))
	return result[0].total
}

export async function approveSubmission(
	d1: D1Database,
	submission: SubmissionDetail
): Promise<number> {
	const newQuestionId = await createQuestion(d1, {
		sectionId: submission.sectionId,
		title: submission.title,
		questionMd: submission.questionMd,
		correctionMd: submission.correctionMd,
		applicableSupports: JSON.parse(submission.applicableSupports),
		difficulty: 'moyen',
		answerSize: 'md',
		status: 'brouillon'
	})

	await getDb(d1)
		.update(communitySubmissions)
		.set({
			status: 'approuve',
			approvedQuestionId: newQuestionId,
			reviewedAt: Math.floor(Date.now() / 1000)
		})
		.where(eq(communitySubmissions.id, submission.id))

	return newQuestionId
}

export async function rejectSubmission(
	d1: D1Database,
	id: number,
	rejectionNote: string | null
): Promise<void> {
	await getDb(d1)
		.update(communitySubmissions)
		.set({
			status: 'rejete',
			rejectionNote: rejectionNote || null,
			reviewedAt: Math.floor(Date.now() / 1000)
		})
		.where(eq(communitySubmissions.id, id))
}
