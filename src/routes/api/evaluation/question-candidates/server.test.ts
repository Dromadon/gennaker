import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './+server'

vi.mock('$lib/server/db/queries/questions', () => ({
	getQuestionCandidates: vi.fn()
}))

const mockCandidates = [
	{
		id: 1,
		sectionId: 10,
		title: 'Feu rouge de mouillage',
		difficulty: 'moyen',
		applicableSupports: [],
		questionMd: 'Quel feu ?',
		correctionMd: 'Un feu rouge',
		answerSize: 'md'
	},
	{
		id: 2,
		sectionId: 10,
		title: 'Balisage latéral',
		difficulty: 'facile',
		applicableSupports: ['deriveur'],
		questionMd: 'Quel balisage ?',
		correctionMd: 'Bâbord tribord',
		answerSize: 'sm'
	},
	{
		id: 3,
		sectionId: 10,
		title: 'Règle de barre catamaran',
		difficulty: 'difficile',
		applicableSupports: ['catamaran'],
		questionMd: 'Quelle règle ?',
		correctionMd: 'RIPAM',
		answerSize: 'md'
	}
]

function makeRequest(body: object) {
	return {
		request: { json: () => Promise.resolve(body) },
		platform: { env: { DB: {} } }
	} as never
}

describe('POST /api/evaluation/question-candidates', () => {
	beforeEach(async () => {
		vi.clearAllMocks()
		const { getQuestionCandidates } = await import('$lib/server/db/queries/questions')
		vi.mocked(getQuestionCandidates).mockResolvedValue(mockCandidates)
	})

	it('retourne 400 si sectionId manquant', async () => {
		await expect(POST(makeRequest({ support: 'deriveur' }))).rejects.toMatchObject({ status: 400 })
	})

	it('retourne 400 si support invalide', async () => {
		await expect(
			POST(makeRequest({ sectionId: 10, support: 'bateau-pirate' }))
		).rejects.toMatchObject({ status: 400 })
	})

	it('retourne les questions compatibles avec le support sans filtre search', async () => {
		const res = await POST(makeRequest({ sectionId: 10, support: 'deriveur' }))
		const data = await res.json()
		// id 1 (tous supports) et id 2 (deriveur) — pas id 3 (catamaran)
		const ids = data.map((q: { id: number }) => q.id)
		expect(ids).toContain(1)
		expect(ids).toContain(2)
		expect(ids).not.toContain(3)
	})

	it('filtre par support catamaran correctement', async () => {
		const res = await POST(makeRequest({ sectionId: 10, support: 'catamaran' }))
		const data = await res.json()
		const ids = data.map((q: { id: number }) => q.id)
		expect(ids).toContain(1) // applicableSupports vide = tous
		expect(ids).toContain(3) // catamaran
		expect(ids).not.toContain(2) // deriveur uniquement
	})

	it('filtre par search (insensible à la casse) sur le titre', async () => {
		const res = await POST(makeRequest({ sectionId: 10, support: 'deriveur', search: 'balisage' }))
		const data = await res.json()
		expect(data).toHaveLength(1)
		expect(data[0].id).toBe(2)
	})

	it('retourne un tableau vide si aucun candidat ne correspond', async () => {
		const res = await POST(makeRequest({ sectionId: 10, support: 'deriveur', search: 'inexistant' }))
		const data = await res.json()
		expect(data).toHaveLength(0)
	})

	it('retourne les champs QuestionPickRow complets', async () => {
		const res = await POST(makeRequest({ sectionId: 10, support: 'deriveur' }))
		const data = await res.json()
		const q = data[0]
		expect(q).toHaveProperty('id')
		expect(q).toHaveProperty('title')
		expect(q).toHaveProperty('difficulty')
		expect(q).toHaveProperty('applicableSupports')
		expect(q).toHaveProperty('questionMd')
		expect(q).toHaveProperty('correctionMd')
		expect(q).toHaveProperty('answerSize')
	})

	it('appelle getQuestionCandidates avec le bon sectionId', async () => {
		const { getQuestionCandidates } = await import('$lib/server/db/queries/questions')
		await POST(makeRequest({ sectionId: 10, support: 'deriveur' }))
		expect(getQuestionCandidates).toHaveBeenCalledWith({}, 10)
	})
})
