import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getSharedEvaluation } from '$lib/server/db/queries/shared-evaluations'
import { getQuestionsByIds } from '$lib/server/db/queries/questions'
import type { Question, EvaluationSlot } from '$lib/domain/types'

export type SharedEvaluationSlotWithUnavailable = EvaluationSlot & {
	unavailableCount: number
}

const CODE_REGEX = /^[A-Za-z0-9]{6}$/

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!CODE_REGEX.test(params.code)) throw error(400, 'Code invalide')

	const db = platform!.env.DB
	const row = await getSharedEvaluation(db, params.code)
	if (!row) throw error(404, 'Ce lien n\'existe pas')

	if (row.expiresAt < Math.floor(Date.now() / 1000)) {
		return { expired: true as const, support: row.supportSlug, format: row.format }
	}

	const allIds = row.slots.flatMap((s) => s.questionIds)
	const foundQuestions = await getQuestionsByIds(db, allIds)
	const questionsById = new Map<number, Question>(foundQuestions.map((q) => [q.id, q]))

	const slots: SharedEvaluationSlotWithUnavailable[] = row.slots.map((slot) => {
		const questions: Question[] = []
		let unavailableCount = 0
		for (const id of slot.questionIds) {
			const q = questionsById.get(id)
			if (q) {
				questions.push(q)
			} else {
				unavailableCount++
			}
		}
		return {
			slotId: slot.slotId,
			sectionId: slot.sectionId,
			categoryId: slot.categoryId,
			sectionDisplayName: slot.sectionDisplayName,
			categoryDisplayName: slot.categoryDisplayName,
			categorySlug: slot.categorySlug,
			sectionSlug: slot.sectionSlug,
			questions,
			unavailableCount
		}
	})

	return {
		expired: false as const,
		support: row.supportSlug,
		format: row.format,
		slots,
		expiresAt: row.expiresAt
	}
}
