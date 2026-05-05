import { describe, it, expect, vi, beforeEach } from 'vitest'
import { noopLogger } from '$lib/server/logger'
import { actions, load } from './+page.server'

const MOCK_SUBMISSION = {
	id: 1,
	title: 'Définition du vent apparent',
	questionMd: 'Qu\'est-ce que le vent apparent ?',
	correctionMd: 'La résultante du vent réel et du vent propre.',
	applicableSupports: '["deriveur","catamaran"]',
	submitterName: 'Jean Dupont',
	submitterEmail: 'jean@example.com',
	sectionId: 2,
	sectionDisplayName: 'Météorologie',
	categoryDisplayName: 'Navigation',
	status: 'en_attente' as const,
	rejectionNote: null,
	approvedQuestionId: null,
	createdAt: 1700000000
}

vi.mock('$lib/server/db/queries/submissions', () => ({
	getSubmissionsAdmin: vi.fn().mockResolvedValue({
		rows: [{
			id: 1,
			title: 'Définition du vent apparent',
			questionMd: 'Qu\'est-ce que le vent apparent ?',
			correctionMd: 'La résultante du vent réel et du vent propre.',
			applicableSupports: '["deriveur","catamaran"]',
			submitterName: 'Jean Dupont',
			submitterEmail: 'jean@example.com',
			sectionId: 2,
			sectionDisplayName: 'Météorologie',
			categoryDisplayName: 'Navigation',
			status: 'en_attente',
			rejectionNote: null,
			approvedQuestionId: null,
			createdAt: 1700000000
		}],
		total: 1
	}),
	getSubmissionById: vi.fn().mockResolvedValue({
		id: 1,
		title: 'Définition du vent apparent',
		questionMd: 'Qu\'est-ce que le vent apparent ?',
		correctionMd: 'La résultante du vent réel et du vent propre.',
		applicableSupports: '["deriveur","catamaran"]',
		submitterName: 'Jean Dupont',
		submitterEmail: 'jean@example.com',
		sectionId: 2,
		sectionDisplayName: 'Météorologie',
		categoryDisplayName: 'Navigation',
		status: 'en_attente',
		rejectionNote: null,
		approvedQuestionId: null,
		createdAt: 1700000000
	}),
	approveSubmission: vi.fn().mockResolvedValue(42),
	rejectSubmission: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('$lib/server/db/queries/questions', () => ({
	getQuestionAdminById: vi.fn().mockResolvedValue(null)
}))

vi.mock('$lib/server/db/queries/audit', () => ({
	insertAuditLog: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('$lib/server/audit', () => ({
	buildQuestionAuditMetadata: vi.fn().mockReturnValue({}),
	buildSubmissionAuditMetadata: vi.fn().mockReturnValue({})
}))

const mockHeaders = { get: vi.fn().mockReturnValue(null) }

function makeFormData(fields: Record<string, string>) {
	const fd = new FormData()
	for (const [key, value] of Object.entries(fields)) fd.append(key, value)
	return fd
}

function makeEvent(fields: Record<string, string>, isAdmin = true) {
	return {
		request: { formData: () => Promise.resolve(makeFormData(fields)), headers: mockHeaders },
		platform: { env: { DB: {} } },
		locals: { isAdmin, adminId: 1, logger: noopLogger, requestId: 'test' }
	} as unknown as Parameters<typeof actions.approve>[0]
}

function makeLoadEvent(params: { isAdmin?: boolean; page?: string; status?: string } = {}) {
	const { isAdmin = true, page, status } = params
	const url = new URL('http://localhost/admin/submissions')
	if (page) url.searchParams.set('page', page)
	if (status) url.searchParams.set('status', status)
	return {
		locals: { isAdmin, logger: noopLogger, requestId: 'test' },
		platform: { env: { DB: {} } },
		url
	} as unknown as Parameters<typeof load>[0]
}

describe('load /admin/submissions', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne rows, total, page et statusFilter', async () => {
		const result = await load(makeLoadEvent()) as Record<string, unknown>
		expect(result).toMatchObject({ total: 1, page: 1, statusFilter: null })
		expect((result.rows as unknown[]).length).toBe(1)
	})

	it('passe le filtre statut à getSubmissionsAdmin', async () => {
		const { getSubmissionsAdmin } = await import('$lib/server/db/queries/submissions')
		await load(makeLoadEvent({ status: 'en_attente' }))
		expect(getSubmissionsAdmin).toHaveBeenCalledWith({}, { status: 'en_attente', page: 1 })
	})

	it('redirige vers /admin/login si non authentifié', async () => {
		await expect(load(makeLoadEvent({ isAdmin: false }))).rejects.toMatchObject({
			status: 302,
			location: '/admin/login'
		})
	})
})

describe('action approve', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne { approved: true, newQuestionId } après approbation', async () => {
		const result = await actions.approve(makeEvent({ id: '1' }))
		expect(result).toMatchObject({ approved: true, newQuestionId: 42 })
	})

	it('retourne 422 si id manquant', async () => {
		const result = await actions.approve(makeEvent({}))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si id non entier', async () => {
		const result = await actions.approve(makeEvent({ id: 'abc' }))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 403 si non authentifié', async () => {
		await expect(actions.approve(makeEvent({ id: '1' }, false))).rejects.toMatchObject({
			status: 403
		})
	})

	it('retourne 404 si soumission introuvable', async () => {
		const { getSubmissionById } = await import('$lib/server/db/queries/submissions')
		vi.mocked(getSubmissionById).mockResolvedValueOnce(null)
		const result = await actions.approve(makeEvent({ id: '99' }))
		expect(result).toMatchObject({ status: 404 })
	})
})

describe('action reject', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne { rejected: true } sans note', async () => {
		const result = await actions.reject(makeEvent({ id: '1' }))
		expect(result).toMatchObject({ rejected: true })
	})

	it('retourne { rejected: true } avec note valide', async () => {
		const result = await actions.reject(makeEvent({ id: '1', rejectionNote: 'Doublon de Q42.' }))
		expect(result).toMatchObject({ rejected: true })
	})

	it('retourne 422 si rejectionNote > 300 caractères', async () => {
		const result = await actions.reject(makeEvent({ id: '1', rejectionNote: 'x'.repeat(301) }))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si id manquant', async () => {
		const result = await actions.reject(makeEvent({}))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 403 si non authentifié', async () => {
		await expect(actions.reject(makeEvent({ id: '1' }, false))).rejects.toMatchObject({
			status: 403
		})
	})

	it('appelle rejectSubmission avec la note', async () => {
		const { rejectSubmission } = await import('$lib/server/db/queries/submissions')
		await actions.reject(makeEvent({ id: '1', rejectionNote: 'Note valide' }))
		expect(rejectSubmission).toHaveBeenCalledWith({}, 1, 'Note valide')
	})

	it('appelle rejectSubmission avec null si note vide', async () => {
		const { rejectSubmission } = await import('$lib/server/db/queries/submissions')
		await actions.reject(makeEvent({ id: '1', rejectionNote: '' }))
		expect(rejectSubmission).toHaveBeenCalledWith({}, 1, null)
	})
})
