import type { QuestionAdminDetail } from '$lib/domain/types'
import type { SubmissionDetail } from '$lib/server/db/queries/submissions'

export type QuestionSnapshot = {
	id: number
	title: string
	sectionId: number
	difficulty: string
	answerSize: string
	status: string
	applicableSupports: string[]
	sourceMd: string | null
	questionMd: string
	correctionMd: string
}

export function questionSnapshot(q: QuestionAdminDetail): QuestionSnapshot {
	return {
		id: q.id,
		title: q.title,
		sectionId: q.sectionId,
		difficulty: q.difficulty,
		answerSize: q.answerSize,
		status: q.status,
		applicableSupports: q.applicableSupports,
		sourceMd: q.sourceMd,
		questionMd: q.questionMd,
		correctionMd: q.correctionMd
	}
}

export function buildQuestionAuditMetadata(
	before: QuestionAdminDetail | null,
	after: QuestionAdminDetail | null
): Record<string, unknown> {
	return {
		before: before ? questionSnapshot(before) : null,
		after: after ? questionSnapshot(after) : null
	}
}

export function buildSubmissionAuditMetadata(
	submission: SubmissionDetail,
	extra?: { newQuestionId?: number; rejectionNote?: string | null }
): Record<string, unknown> {
	return {
		submissionId: submission.id,
		title: submission.title,
		submitterName: submission.submitterName,
		submitterEmail: submission.submitterEmail,
		...(extra?.newQuestionId !== undefined ? { newQuestionId: extra.newQuestionId } : {}),
		...(extra?.rejectionNote ? { rejectionNote: extra.rejectionNote } : {})
	}
}

export function buildReportAuditMetadata(
	reportId: number,
	questionId: number,
	newStatus: 'resolu' | 'nouveau'
): Record<string, unknown> {
	return { reportId, questionId, newStatus }
}
