import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, questionImages, questions, sections } from '../schema'
import type { Question } from '$lib/domain/types'

export type QuestionExportRow = {
	id: number
	categorySlug: string
	sectionSlug: string
	title: string
	questionMd: string
	correctionMd: string
}

export type ImageExportRow = {
	questionId: number
	filename: string
	categorySlug: string
	sectionSlug: string
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

export async function getAllImagesForExport(d1: D1Database): Promise<ImageExportRow[]> {
	return getDb(d1)
		.select({
			questionId: questionImages.questionId,
			filename: questionImages.filename,
			categorySlug: categories.slug,
			sectionSlug: sections.slug
		})
		.from(questionImages)
		.innerJoin(questions, eq(questions.id, questionImages.questionId))
		.innerJoin(sections, eq(sections.id, questions.sectionId))
		.innerJoin(categories, eq(categories.id, sections.categoryId))
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
