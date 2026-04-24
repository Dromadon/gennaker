import { writable } from 'svelte/store'
import type { Evaluation, Question } from '$lib/domain/types'

export const evaluationStore = writable<Evaluation | null>(null)

export function replaceQuestion(slotId: number, oldId: number, newQuestion: Question) {
	evaluationStore.update((ev) => {
		if (!ev) return ev
		return {
			...ev,
			slots: ev.slots.map((slot) =>
				slot.slotId !== slotId
					? slot
					: {
							...slot,
							questions: slot.questions.map((q) => (q.id === oldId ? newQuestion : q))
						}
			)
		}
	})
}
