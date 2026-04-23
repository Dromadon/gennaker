import { describe, it, expect, vi, beforeEach } from 'vitest'
import { drawEvaluation } from './draw'
import type { EvaluationTemplate, Question } from './types'

const makeQuestion = (id: number, supports: string[] = []): Question => ({
	id,
	sectionId: 1,
	title: `Question ${id}`,
	questionMd: `Énoncé ${id}`,
	correctionMd: `Correction ${id}`,
	applicableSupports: supports as Question['applicableSupports']
})

const makeTemplate = (questionCount: number): EvaluationTemplate => ({
	id: 1,
	support: 'deriveur',
	format: 'standard',
	slots: [
		{
			id: 1,
			sectionId: 1,
			categoryId: 1,
			sectionDisplayName: 'Section test',
			categoryDisplayName: 'Catégorie test',
			position: 1,
			questionCount
		}
	]
})

beforeEach(() => {
	vi.spyOn(Math, 'random').mockReturnValue(0)
})

describe('drawEvaluation', () => {
	it('retourne le bon nombre de questions', () => {
		const questions = [1, 2, 3, 4, 5].map((id) => makeQuestion(id))
		const result = drawEvaluation(makeTemplate(3), { 1: questions })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questions).toHaveLength(3)
	})

	it('filtre les questions par support applicable', () => {
		const questions = [
			makeQuestion(1, ['catamaran']),
			makeQuestion(2, []),
			makeQuestion(3, ['deriveur', 'catamaran']),
			makeQuestion(4, ['windsurf'])
		]
		const result = drawEvaluation(makeTemplate(10), { 1: questions })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		const ids = result.value.slots[0].questions.map((q) => q.id)
		expect(ids).toContain(2)
		expect(ids).toContain(3)
		expect(ids).not.toContain(1)
		expect(ids).not.toContain(4)
	})

	it('accepte les questions sans restriction de support (applicableSupports vide)', () => {
		const questions = [makeQuestion(1, []), makeQuestion(2, [])]
		const result = drawEvaluation(makeTemplate(2), { 1: questions })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questions).toHaveLength(2)
	})

	it('retourne ok:false si la banque est vide pour un slot', () => {
		const result = drawEvaluation(makeTemplate(1), { 1: [] })
		expect(result.ok).toBe(false)
	})

	it('retourne le maximum disponible si la banque est insuffisante', () => {
		const questions = [makeQuestion(1), makeQuestion(2)]
		const result = drawEvaluation(makeTemplate(5), { 1: questions })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questions).toHaveLength(2)
	})

	it('produit un tirage différent selon Math.random', () => {
		const questions = [1, 2, 3, 4, 5].map((id) => makeQuestion(id))
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result1 = drawEvaluation(makeTemplate(3), { 1: questions })
		vi.spyOn(Math, 'random').mockReturnValue(0.9)
		const result2 = drawEvaluation(makeTemplate(3), { 1: questions })
		expect(result1.ok).toBe(true)
		expect(result2.ok).toBe(true)
		if (!result1.ok || !result2.ok) return
		const ids1 = result1.value.slots[0].questions.map((q) => q.id)
		const ids2 = result2.value.slots[0].questions.map((q) => q.id)
		expect(ids1).not.toEqual(ids2)
	})
})
