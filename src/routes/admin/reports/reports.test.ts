import { describe, it, expect, vi, beforeEach } from 'vitest'
import { load, actions } from './+page.server'

vi.mock('$lib/server/db/queries/reports', () => ({
	getReportsAdmin: vi.fn().mockResolvedValue({
		rows: [
			{
				id: 1,
				questionId: 42,
				questionTitle: 'Ma question',
				questionMd: '# Énoncé',
				correctionMd: '# Correction',
				sourceMd: null,
				categoryDisplayName: 'Météo',
				sectionDisplayName: 'Vents',
				difficulty: 'moyen',
				applicableSupports: '[]',
				problemType: 'enonce_incorrect',
				description: 'Texte erroné',
				email: null,
				status: 'nouveau',
				createdAt: 1700000000
			}
		],
		total: 1
	}),
	updateReportStatus: vi.fn().mockResolvedValue(undefined)
}))

function makeEvent(isAdmin: boolean, extra: object = {}) {
	return {
		locals: { isAdmin },
		platform: { env: { DB: {} } },
		url: new URL('http://localhost/admin/reports'),
		...extra
	} as unknown as Parameters<typeof load>[0]
}

// ──────────────────────────────────────────────────────
// load
// ──────────────────────────────────────────────────────

describe('load /admin/reports', () => {
	beforeEach(() => vi.clearAllMocks())

	it('redirige si non authentifié', async () => {
		await expect(load(makeEvent(false))).rejects.toMatchObject({
			status: 302,
			location: '/admin/login'
		})
	})

	it('retourne rows, total, page, statusFilter si authentifié', async () => {
		const result = (await load(makeEvent(true))) as Record<string, unknown>
		expect((result.rows as unknown[]).length).toBe(1)
		expect(result.total).toBe(1)
		expect(result.page).toBe(1)
		expect(result.statusFilter).toBeNull()
	})
})

// ──────────────────────────────────────────────────────
// action toggleStatus
// ──────────────────────────────────────────────────────

describe('action toggleStatus /admin/reports', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 403 si non authentifié', async () => {
		const formData = new FormData()
		formData.append('id', '1')
		formData.append('status', 'resolu')
		await expect(
			actions.toggleStatus({
				...makeEvent(false),
				request: { formData: () => Promise.resolve(formData) }
			} as never)
		).rejects.toMatchObject({ status: 403 })
	})

	it('retourne 422 si id manquant', async () => {
		const formData = new FormData()
		formData.append('status', 'resolu')
		const result = await actions.toggleStatus({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect((result as { status: number }).status).toBe(422)
	})

	it('retourne 422 si status invalide', async () => {
		const formData = new FormData()
		formData.append('id', '1')
		formData.append('status', 'en_cours')
		const result = await actions.toggleStatus({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect((result as { status: number }).status).toBe(422)
	})

	it('retourne 422 si status inconnu', async () => {
		const formData = new FormData()
		formData.append('id', '1')
		formData.append('status', 'inconnu')
		const result = await actions.toggleStatus({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect((result as { status: number }).status).toBe(422)
	})

	it('marque résolu et retourne { updated: true }', async () => {
		const { updateReportStatus } = await import('$lib/server/db/queries/reports')
		const formData = new FormData()
		formData.append('id', '1')
		formData.append('status', 'resolu')
		const result = await actions.toggleStatus({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect(updateReportStatus).toHaveBeenCalledWith({}, 1, 'resolu')
		expect(result).toEqual({ updated: true })
	})

	it('rouvre un signalement résolu et retourne { updated: true }', async () => {
		const { updateReportStatus } = await import('$lib/server/db/queries/reports')
		const formData = new FormData()
		formData.append('id', '1')
		formData.append('status', 'nouveau')
		const result = await actions.toggleStatus({
			...makeEvent(true),
			request: { formData: () => Promise.resolve(formData) }
		} as never)
		expect(updateReportStatus).toHaveBeenCalledWith({}, 1, 'nouveau')
		expect(result).toEqual({ updated: true })
	})
})
