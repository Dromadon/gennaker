import type { Evaluation, EvaluationTemplate, Question, Support } from './types'
import type { QuestionMeta } from '$lib/server/db/queries/questions'

type Result<T> = { ok: true; value: T } | { ok: false; error: string }

function shuffle<T>(arr: T[]): T[] {
	const copy = [...arr]
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[copy[i], copy[j]] = [copy[j], copy[i]]
	}
	return copy
}

export type DrawnSlot = {
	slotId: number
	sectionId: number
	categoryId: number
	sectionDisplayName: string
	categoryDisplayName: string
	categorySlug: string
	sectionSlug: string
	questionIds: number[]
}

export type DrawnEvaluation = {
	support: Support
	format: Evaluation['format']
	slots: DrawnSlot[]
}

export function drawEvaluation(
	template: EvaluationTemplate,
	metaBySection: Record<number, QuestionMeta[]>
): Result<DrawnEvaluation> {
	const slots = []

	for (const slot of template.slots) {
		const pool = (metaBySection[slot.sectionId] ?? []).filter(
			(q) =>
				q.applicableSupports.length === 0 || q.applicableSupports.includes(template.support)
		)

		if (pool.length === 0) {
			return {
				ok: false,
				error: `Aucune question disponible pour la section "${slot.sectionDisplayName}"`
			}
		}

		slots.push({
			slotId: slot.id,
			sectionId: slot.sectionId,
			categoryId: slot.categoryId,
			sectionDisplayName: slot.sectionDisplayName,
			categoryDisplayName: slot.categoryDisplayName,
			categorySlug: slot.categorySlug,
			sectionSlug: slot.sectionSlug,
			questionIds: shuffle(pool).slice(0, slot.questionCount).map((q) => q.id)
		})
	}

	return {
		ok: true,
		value: { support: template.support, format: template.format, slots }
	}
}

export function pickReplacement(
	pool: QuestionMeta[],
	excludeIds: number[],
	support: Support
): number | null {
	const candidates = pool.filter(
		(q) =>
			!excludeIds.includes(q.id) &&
			(q.applicableSupports.length === 0 || q.applicableSupports.includes(support))
	)
	if (candidates.length === 0) return null
	return candidates[Math.floor(Math.random() * candidates.length)].id
}
