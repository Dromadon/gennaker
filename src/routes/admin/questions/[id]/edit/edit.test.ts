import { describe, it, expect, vi, beforeEach } from 'vitest'
import { load, actions } from './+page.server'

vi.mock('$lib/server/db/queries/categories', () => ({
	getAllCategoriesWithSections: vi.fn().mockResolvedValue([])
}))

vi.mock('$lib/server/db/queries/questions', () => ({
	getQuestionAdminById: vi.fn().mockResolvedValue({
		id: 5,
		sectionId: 10,
		title: 'Q existante',
		questionMd: 'Enoncé',
		correctionMd: 'Correction',
		difficulty: 'moyen',
		status: 'publie',
		answerSize: 'md',
		applicableSupports: [],
		sourceMd: null,
		categoryDisplayName: 'Sécurité',
		sectionDisplayName: 'Feux',
		categorySlug: 'securite',
		sectionSlug: 'feux'
	}),
	updateQuestion: vi.fn().mockResolvedValue(undefined),
	deleteQuestion: vi.fn().mockResolvedValue(undefined)
}))

function makeEvent(isAdmin: boolean, params = { id: '5' }, extra: object = {}) {
	return {
		locals: { isAdmin },
		platform: { env: { DB: {} } },
		params,
		...extra
	} as unknown as Parameters<typeof load>[0]
}

// ──────────────────────────────────────────────────────
// Load
// ──────────────────────────────────────────────────────

describe('load /admin/questions/[id]/edit', () => {
	beforeEach(() => vi.clearAllMocks())

	it('redirige si non authentifié', async () => {
		await expect(load(makeEvent(false))).rejects.toMatchObject({
			status: 302,
			location: '/admin/login'
		})
	})

	it('retourne 404 si question inexistante', async () => {
		const { getQuestionAdminById } = await import('$lib/server/db/queries/questions')
		vi.mocked(getQuestionAdminById).mockResolvedValueOnce(null)
		await expect(load(makeEvent(true))).rejects.toMatchObject({ status: 404 })
	})

	it('retourne la question si authentifié', async () => {
		const result = (await load(makeEvent(true))) as Record<string, unknown>
		expect((result.question as { id: number }).id).toBe(5)
	})
})

// ──────────────────────────────────────────────────────
// Action update
// ──────────────────────────────────────────────────────

describe('action update /admin/questions/[id]/edit', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 403 si non authentifié', async () => {
		const formData = new FormData()
		await expect(
			actions.update({
				...makeEvent(false),
				request: { formData: () => Promise.resolve(formData) }
			} as never)
		).rejects.toMatchObject({ status: 403 })
	})

	it('retourne 422 si données invalides', async () => {
		const formData = new FormData()
		formData.append('title', '')
		const result = await actions.update({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect((result as { status: number }).status).toBe(422)
	})

	it('met à jour la question si données valides', async () => {
		const { updateQuestion } = await import('$lib/server/db/queries/questions')
		const formData = new FormData()
		formData.append('title', 'Titre mis à jour')
		formData.append('sectionId', '10')
		formData.append('questionMd', 'Enoncé')
		formData.append('correctionMd', 'Correction')
		formData.append('difficulty', 'moyen')
		formData.append('answerSize', 'md')
		formData.append('status', 'publie')
		const result = await actions.update({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect(updateQuestion).toHaveBeenCalledWith(
			{},
			5,
			expect.objectContaining({ title: 'Titre mis à jour' })
		)
		expect(result).toEqual({ updated: true })
	})
})

// ──────────────────────────────────────────────────────
// Action delete
// ──────────────────────────────────────────────────────

describe('action delete /admin/questions/[id]/edit', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 403 si non authentifié', async () => {
		await expect(actions.delete(makeEvent(false) as never)).rejects.toMatchObject({ status: 403 })
	})

	it('supprime la question et redirige si authentifié', async () => {
		const { deleteQuestion } = await import('$lib/server/db/queries/questions')
		await expect(actions.delete(makeEvent(true) as never)).rejects.toMatchObject({
			status: 302,
			location: '/admin/questions'
		})
		expect(deleteQuestion).toHaveBeenCalledWith({}, 5)
	})
})
