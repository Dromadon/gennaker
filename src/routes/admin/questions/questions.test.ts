import { describe, it, expect, vi, beforeEach } from 'vitest'
import { load as listLoad, actions as listActions } from './+page.server'
import { load as newLoad, actions as newActions } from './new/+page.server'

vi.mock('$lib/server/db/queries/categories', () => ({
	getAllCategoriesWithSections: vi.fn().mockResolvedValue([
		{ id: 1, slug: 'securite', displayName: 'Sécurité', sections: [] }
	])
}))

vi.mock('$lib/server/db/queries/questions', () => ({
	listQuestions: vi.fn().mockResolvedValue({
		rows: [
			{
				id: 1,
				title: 'Q1',
				difficulty: 'moyen',
				status: 'publie',
				answerSize: 'md',
				applicableSupports: [],
				categoryDisplayName: 'Sécurité',
				sectionDisplayName: 'Feux',
				categorySlug: 'securite',
				sectionSlug: 'feux',
				questionMd: '# Énoncé',
				correctionMd: '# Correction',
				sourceMd: null
			}
		],
		total: 1
	}),
	createQuestion: vi.fn().mockResolvedValue(42),
	deleteQuestion: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('$lib/server/db/queries/reports', () => ({
	getReportsByQuestionIds: vi.fn().mockResolvedValue([
		{
			id: 10,
			questionId: 1,
			problemType: 'enonce_incorrect',
			description: 'Texte erroné',
			email: null,
			status: 'nouveau',
			createdAt: 1700000000
		}
	])
}))

function makeEvent(isAdmin: boolean, extra: object = {}) {
	return {
		locals: { isAdmin },
		platform: { env: { DB: {} } },
		url: new URL('http://localhost/admin/questions'),
		...extra
	} as unknown as Parameters<typeof listLoad>[0]
}

// ──────────────────────────────────────────────────────
// Liste /admin/questions
// ──────────────────────────────────────────────────────

describe('load /admin/questions', () => {
	beforeEach(() => vi.clearAllMocks())

	it('redirige si non authentifié', async () => {
		await expect(listLoad(makeEvent(false))).rejects.toMatchObject({
			status: 302,
			location: '/admin/login'
		})
	})

	it('retourne rows, total, categories si authentifié', async () => {
		const result = (await listLoad(makeEvent(true))) as Record<string, unknown>
		expect((result.rows as unknown[]).length).toBe(1)
		expect(result.total).toBe(1)
		expect((result.categories as unknown[]).length).toBe(1)
	})

	it('retourne reportsByQuestionId groupés par questionId', async () => {
		const result = (await listLoad(makeEvent(true))) as Record<string, unknown>
		const reports = result.reportsByQuestionId as Record<number, unknown[]>
		expect(reports[1]).toHaveLength(1)
		expect((reports[1][0] as Record<string, unknown>).problemType).toBe('enonce_incorrect')
	})

	it('retourne reportsByQuestionId vide si aucun signalement', async () => {
		const { getReportsByQuestionIds } = await import('$lib/server/db/queries/reports')
		vi.mocked(getReportsByQuestionIds).mockResolvedValueOnce([])
		const result = (await listLoad(makeEvent(true))) as Record<string, unknown>
		const reports = result.reportsByQuestionId as Record<number, unknown[]>
		expect(Object.keys(reports)).toHaveLength(0)
	})
})

describe('action delete /admin/questions', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 403 si non authentifié', async () => {
		const formData = new FormData()
		formData.append('id', '1')
		await expect(
			listActions.delete({
				...makeEvent(false),
				request: { formData: () => Promise.resolve(formData) }
			} as never)
		).rejects.toMatchObject({ status: 403 })
	})

	it('supprime la question si authentifié', async () => {
		const { deleteQuestion } = await import('$lib/server/db/queries/questions')
		const formData = new FormData()
		formData.append('id', '1')
		const result = await listActions.delete({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect(deleteQuestion).toHaveBeenCalledWith({}, 1)
		expect(result).toEqual({ deleted: true })
	})
})

// ──────────────────────────────────────────────────────
// Création /admin/questions/new
// ──────────────────────────────────────────────────────

describe('load /admin/questions/new', () => {
	beforeEach(() => vi.clearAllMocks())

	it('redirige si non authentifié', async () => {
		await expect(newLoad(makeEvent(false) as never)).rejects.toMatchObject({
			status: 302,
			location: '/admin/login'
		})
	})

	it('retourne les catégories si authentifié', async () => {
		const result = (await newLoad(makeEvent(true) as never)) as Record<string, unknown>
		expect((result.categories as unknown[]).length).toBe(1)
	})
})

describe('action create /admin/questions/new', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 403 si non authentifié', async () => {
		const formData = new FormData()
		await expect(
			newActions.create({
				...makeEvent(false),
				request: { formData: () => Promise.resolve(formData) }
			} as never)
		).rejects.toMatchObject({ status: 403 })
	})

	it('retourne 422 si données invalides', async () => {
		const formData = new FormData()
		formData.append('title', '')
		const result = await newActions.create({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect((result as { status: number }).status).toBe(422)
	})

	it('crée la question et redirige si données valides', async () => {
		const { createQuestion } = await import('$lib/server/db/queries/questions')
		const formData = new FormData()
		formData.append('title', 'Ma question')
		formData.append('sectionId', '10')
		formData.append('questionMd', 'Enoncé')
		formData.append('correctionMd', 'Correction')
		formData.append('difficulty', 'moyen')
		formData.append('answerSize', 'md')
		formData.append('status', 'brouillon')
		await expect(
			newActions.create({
				...makeEvent(true),
				request: { formData: () => Promise.resolve(formData) }
			} as never)
		).rejects.toMatchObject({ status: 302 })
		expect(createQuestion).toHaveBeenCalled()
	})
})
