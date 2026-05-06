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

		const selected: number[] = []
		let remaining = pool

		// 1. Question épinglée
		if (slot.pinnedQuestionId !== null) {
			const pinned = pool.find((q) => q.id === slot.pinnedQuestionId)
			if (pinned) {
				selected.push(pinned.id)
				remaining = pool.filter((q) => q.id !== slot.pinnedQuestionId)
			}
		}

		let needed = slot.questionCount - selected.length

		// 2. Questions préférées (priorité sur la banque globale)
		if (needed > 0 && slot.preferredQuestionIds.length > 0) {
			const preferredSet = new Set(slot.preferredQuestionIds)
			const preferredPool = remaining.filter((q) => preferredSet.has(q.id))
			const fromPreferred = shuffle(preferredPool).slice(0, needed)
			const fromPreferredSet = new Set(fromPreferred.map((q) => q.id))
			for (const q of fromPreferred) selected.push(q.id)
			remaining = remaining.filter((q) => !fromPreferredSet.has(q.id))
			needed -= fromPreferred.length
		}

		// 3. Complément depuis la banque globale
		if (needed > 0) {
			const preferredSet = new Set(slot.preferredQuestionIds)
			const fallbackPool = remaining.filter((q) => !preferredSet.has(q.id))
			const fromFallback = shuffle(fallbackPool).slice(0, needed)
			for (const q of fromFallback) selected.push(q.id)
		}

		slots.push({
			slotId: slot.id,
			sectionId: slot.sectionId,
			categoryId: slot.categoryId,
			sectionDisplayName: slot.sectionDisplayName,
			categoryDisplayName: slot.categoryDisplayName,
			categorySlug: slot.categorySlug,
			sectionSlug: slot.sectionSlug,
			questionIds: selected
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
