import { describe, it, expect, beforeEach } from 'vitest'
import { get } from 'svelte/store'
import { evaluationStore, replaceQuestion, setSlotQuestions } from './evaluation'
import type { Evaluation, Question } from '$lib/domain/types'

const makeQuestion = (id: number): Question => ({
	id,
	sectionId: 1,
	title: `Question ${id}`,
	questionMd: `Énoncé ${id}`,
	correctionMd: `Correction ${id}`,
	applicableSupports: [],
	answerSize: 'md'
})

const makeEvaluation = (): Evaluation => ({
	support: 'deriveur',
	format: 'standard',
	slots: [
		{
			slotId: 10,
			sectionId: 1,
			categoryId: 1,
			sectionDisplayName: 'Section A',
			categoryDisplayName: 'Catégorie 1',
			categorySlug: 'cat-1',
			sectionSlug: 'section-a',
			questions: [makeQuestion(1), makeQuestion(2)]
		},
		{
			slotId: 20,
			sectionId: 2,
			categoryId: 1,
			sectionDisplayName: 'Section B',
			categoryDisplayName: 'Catégorie 1',
			categorySlug: 'cat-1',
			sectionSlug: 'section-b',
			questions: [makeQuestion(3)]
		}
	]
})

beforeEach(() => {
	evaluationStore.set(makeEvaluation())
})

describe('replaceQuestion', () => {
	it('remplace la question ciblée dans le bon slot', () => {
		const replacement = makeQuestion(99)
		replaceQuestion(10, 1, replacement)
		const ev = get(evaluationStore)!
		const slot = ev.slots.find((s) => s.slotId === 10)!
		expect(slot.questions.map((q) => q.id)).toEqual([99, 2])
	})

	it("ne modifie pas les autres slots", () => {
		replaceQuestion(10, 1, makeQuestion(99))
		const ev = get(evaluationStore)!
		const other = ev.slots.find((s) => s.slotId === 20)!
		expect(other.questions.map((q) => q.id)).toEqual([3])
	})

	it('ne fait rien si le store est null', () => {
		evaluationStore.set(null)
		replaceQuestion(10, 1, makeQuestion(99))
		expect(get(evaluationStore)).toBeNull()
	})
})

describe('setSlotQuestions', () => {
	it('remplace toutes les questions du slot ciblé', () => {
		setSlotQuestions(10, [makeQuestion(7), makeQuestion(8)])
		const ev = get(evaluationStore)!
		const slot = ev.slots.find((s) => s.slotId === 10)!
		expect(slot.questions.map((q) => q.id)).toEqual([7, 8])
	})

	it('vide le slot quand on passe un tableau vide', () => {
		setSlotQuestions(10, [])
		const ev = get(evaluationStore)!
		const slot = ev.slots.find((s) => s.slotId === 10)!
		expect(slot.questions).toHaveLength(0)
	})

	it("ne modifie pas les autres slots", () => {
		setSlotQuestions(10, [makeQuestion(7)])
		const ev = get(evaluationStore)!
		const other = ev.slots.find((s) => s.slotId === 20)!
		expect(other.questions.map((q) => q.id)).toEqual([3])
	})

	it('ne fait rien si le store est null', () => {
		evaluationStore.set(null)
		setSlotQuestions(10, [makeQuestion(7)])
		expect(get(evaluationStore)).toBeNull()
	})
})
