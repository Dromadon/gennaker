import { describe, it, expect, vi, beforeEach } from 'vitest'
import { drawEvaluation, pickReplacement } from './draw'
import type { EvaluationTemplate } from './types'
import type { QuestionMeta } from '$lib/server/db/queries/questions'

const makeMeta = (id: number, supports: string[] = [], sectionId = 1): QuestionMeta => ({
	id,
	sectionId,
	applicableSupports: supports as QuestionMeta['applicableSupports'],
	answerSize: 'md'
})

const makeTemplate = (
	questionCount: number,
	pinnedQuestionId: number | null = null,
	preferredQuestionIds: number[] = []
): EvaluationTemplate => ({
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
			categorySlug: 'test-cat',
			sectionSlug: 'test-section',
			position: 1,
			questionCount,
			pinnedQuestionId,
			preferredQuestionIds
		}
	]
})

beforeEach(() => {
	vi.spyOn(Math, 'random').mockReturnValue(0)
})

describe('drawEvaluation', () => {
	it('retourne le bon nombre de questions', () => {
		const pool = [1, 2, 3, 4, 5].map((id) => makeMeta(id))
		const result = drawEvaluation(makeTemplate(3), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questionIds).toHaveLength(3)
	})

	it('filtre les questions par support applicable', () => {
		const pool = [
			makeMeta(1, ['catamaran']),
			makeMeta(2, []),
			makeMeta(3, ['deriveur', 'catamaran']),
			makeMeta(4, ['windsurf'])
		]
		const result = drawEvaluation(makeTemplate(10), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		const ids = result.value.slots[0].questionIds
		expect(ids).toContain(2)
		expect(ids).toContain(3)
		expect(ids).not.toContain(1)
		expect(ids).not.toContain(4)
	})

	it('accepte les questions sans restriction de support (applicableSupports vide)', () => {
		const pool = [makeMeta(1, []), makeMeta(2, [])]
		const result = drawEvaluation(makeTemplate(2), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questionIds).toHaveLength(2)
	})

	it('retourne ok:false si la banque est vide pour un slot', () => {
		const result = drawEvaluation(makeTemplate(1), { 1: [] })
		expect(result.ok).toBe(false)
	})

	it('retourne le maximum disponible si la banque est insuffisante', () => {
		const pool = [makeMeta(1), makeMeta(2)]
		const result = drawEvaluation(makeTemplate(5), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questionIds).toHaveLength(2)
	})

	it('produit un tirage différent selon Math.random', () => {
		const pool = [1, 2, 3, 4, 5].map((id) => makeMeta(id))
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result1 = drawEvaluation(makeTemplate(3), { 1: pool })
		vi.spyOn(Math, 'random').mockReturnValue(0.9)
		const result2 = drawEvaluation(makeTemplate(3), { 1: pool })
		expect(result1.ok).toBe(true)
		expect(result2.ok).toBe(true)
		if (!result1.ok || !result2.ok) return
		expect(result1.value.slots[0].questionIds).not.toEqual(result2.value.slots[0].questionIds)
	})
})

describe('drawEvaluation — pinned/preferred', () => {
	it('inclut systématiquement la question épinglée si disponible', () => {
		const pool = [1, 2, 3, 4, 5].map((id) => makeMeta(id))
		const result = drawEvaluation(makeTemplate(3, 1), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questionIds).toContain(1)
	})

	it('retourne uniquement la question épinglée si count = 1', () => {
		const pool = [1, 2, 3].map((id) => makeMeta(id))
		const result = drawEvaluation(makeTemplate(1, 2), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questionIds).toEqual([2])
	})

	it('dégrade silencieusement si la question épinglée est absente du pool', () => {
		const pool = [1, 2, 3].map((id) => makeMeta(id))
		const result = drawEvaluation(makeTemplate(2, 99), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questionIds).not.toContain(99)
		expect(result.value.slots[0].questionIds).toHaveLength(2)
	})

	it('tire en priorité depuis la liste preferred si le pool est suffisant', () => {
		const pool = [1, 2, 3, 4, 5].map((id) => makeMeta(id))
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = drawEvaluation(makeTemplate(2, null, [3, 4, 5]), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		const ids = result.value.slots[0].questionIds
		expect(ids.every((id) => [3, 4, 5].includes(id))).toBe(true)
	})

	it('complète depuis la banque globale si preferred insuffisant', () => {
		const pool = [1, 2, 3, 4, 5].map((id) => makeMeta(id))
		const result = drawEvaluation(makeTemplate(4, null, [3]), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		const ids = result.value.slots[0].questionIds
		expect(ids).toHaveLength(4)
		expect(ids).toContain(3)
	})

	it('combine pinned + preferred : épinglée en premier, count-1 depuis preferred', () => {
		const pool = [1, 2, 3, 4, 5].map((id) => makeMeta(id))
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = drawEvaluation(makeTemplate(3, 1, [2, 3, 4]), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		const ids = result.value.slots[0].questionIds
		expect(ids).toContain(1)
		expect(ids).toHaveLength(3)
		// les 2 autres viennent de preferred (2,3,4)
		const others = ids.filter((id) => id !== 1)
		expect(others.every((id) => [2, 3, 4].includes(id))).toBe(true)
	})

	it('avec pinned indispo : tire depuis preferred puis banque', () => {
		const pool = [1, 2, 3, 4].map((id) => makeMeta(id))
		vi.spyOn(Math, 'random').mockReturnValue(0)
		const result = drawEvaluation(makeTemplate(2, 99, [1, 2]), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		const ids = result.value.slots[0].questionIds
		expect(ids).not.toContain(99)
		expect(ids).toHaveLength(2)
		expect(ids.every((id) => [1, 2].includes(id))).toBe(true)
	})

	it('ne change pas le comportement si preferredQuestionIds est vide', () => {
		const pool = [1, 2, 3, 4, 5].map((id) => makeMeta(id))
		const result = drawEvaluation(makeTemplate(3, null, []), { 1: pool })
		expect(result.ok).toBe(true)
		if (!result.ok) return
		expect(result.value.slots[0].questionIds).toHaveLength(3)
	})
})

describe('pickReplacement', () => {
	it("exclut les questions dont l'id est dans excludeIds", () => {
		const pool = [1, 2, 3].map((id) => makeMeta(id))
		const result = pickReplacement(pool, [1, 2], 'deriveur')
		expect(result).toBe(3)
	})

	it('exclut les questions incompatibles avec le support', () => {
		const pool = [makeMeta(1, ['catamaran']), makeMeta(2, []), makeMeta(3, ['deriveur'])]
		const result = pickReplacement(pool, [], 'deriveur')
		expect(result).not.toBe(1)
	})

	it('retourne null si aucun candidat disponible', () => {
		const pool = [makeMeta(1), makeMeta(2)]
		const result = pickReplacement(pool, [1, 2], 'deriveur')
		expect(result).toBeNull()
	})

	it('retourne un id valide parmi les candidats', () => {
		const pool = [1, 2, 3].map((id) => makeMeta(id))
		const result = pickReplacement(pool, [1], 'deriveur')
		expect(result).not.toBeNull()
		expect([2, 3]).toContain(result)
	})

	it('accepte les questions avec applicableSupports vide (tous supports)', () => {
		const pool = [makeMeta(1, []), makeMeta(2, ['catamaran'])]
		const result = pickReplacement(pool, [], 'deriveur')
		expect(result).toBe(1)
	})
})
