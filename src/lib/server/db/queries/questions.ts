import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../index'
import { questions } from '../schema'
import type { Question } from '$lib/domain/types'

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
