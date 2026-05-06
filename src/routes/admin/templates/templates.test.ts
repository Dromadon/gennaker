import { describe, it, expect, vi, beforeEach } from 'vitest'
import { noopLogger } from '$lib/server/logger'
import { load, actions } from './+page.server'

vi.mock('$lib/server/db/queries/templates', () => ({
	getAllTemplatesWithSlots: vi.fn().mockResolvedValue([
		{
			id: 1,
			supportSlug: 'deriveur',
			format: 'standard',
			slots: [
				{
					id: 5,
					sectionId: 3,
					categoryId: 1,
					sectionDisplayName: 'Prévisions',
					categoryDisplayName: 'Météo',
					categorySlug: 'meteo',
					sectionSlug: 'previsions',
					position: 1,
					questionCount: 3,
					pinnedQuestionId: null,
					preferredQuestionIds: [],
					pinnedQuestionTitle: null,
					preferredQuestions: []
				}
			]
		}
	]),
	getTemplateSlotById: vi.fn().mockResolvedValue({ id: 5, templateId: 2, pinnedQuestionId: null, preferredQuestionIds: [] }),
	updateTemplateSlot: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('$lib/server/db/queries/audit', () => ({
	insertAuditLog: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('$lib/server/audit', () => ({
	buildSlotAuditMetadata: vi.fn().mockReturnValue({})
}))

const mockHeaders = { get: vi.fn().mockReturnValue(null) }

function makeRequest(formData: FormData) {
	return { formData: () => Promise.resolve(formData), headers: mockHeaders }
}

function makeEvent(isAdmin: boolean) {
	return {
		locals: { isAdmin, adminId: 1, logger: noopLogger, requestId: 'test' },
		platform: { env: { DB: {} } },
		url: new URL('http://localhost/admin/templates'),
		request: { headers: mockHeaders }
	} as unknown as Parameters<typeof load>[0]
}

describe('load /admin/templates', () => {
	beforeEach(() => vi.clearAllMocks())

	it('redirige si non authentifié', async () => {
		await expect(load(makeEvent(false))).rejects.toMatchObject({ status: 302, location: '/admin/login' })
	})

	it('retourne les templates si authentifié', async () => {
		const { getAllTemplatesWithSlots } = await import('$lib/server/db/queries/templates')
		const result = (await load(makeEvent(true))) as Record<string, unknown>
		expect(getAllTemplatesWithSlots).toHaveBeenCalledWith({})
		expect((result.templates as unknown[]).length).toBe(1)
	})
})

describe('action setPinned', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 403 si non authentifié', async () => {
		const formData = new FormData()
		formData.append('slotId', '5')
		formData.append('questionId', '42')
		await expect(
			actions.setPinned({ ...makeEvent(false), request: makeRequest(formData) } as never)
		).rejects.toMatchObject({ status: 403 })
	})

	it('retourne fail(400) si slotId invalide', async () => {
		const formData = new FormData()
		formData.append('slotId', 'abc')
		formData.append('questionId', '42')
		const result = await actions.setPinned({ ...makeEvent(true), request: makeRequest(formData) } as never)
		expect(result).toMatchObject({ status: 400 })
	})

	it('appelle updateTemplateSlot avec le bon patch', async () => {
		const { updateTemplateSlot } = await import('$lib/server/db/queries/templates')
		const { insertAuditLog } = await import('$lib/server/db/queries/audit')
		const formData = new FormData()
		formData.append('slotId', '5')
		formData.append('questionId', '42')
		const result = await actions.setPinned({ ...makeEvent(true), request: makeRequest(formData) } as never)
		expect(updateTemplateSlot).toHaveBeenCalledWith({}, 5, { pinnedQuestionId: 42, preferredQuestionIds: [] })
		expect(insertAuditLog).toHaveBeenCalled()
		expect(result).toEqual({})
	})

	it('appelle updateTemplateSlot avec null pour effacer le pin', async () => {
		const { updateTemplateSlot } = await import('$lib/server/db/queries/templates')
		const formData = new FormData()
		formData.append('slotId', '5')
		formData.append('questionId', '')
		await actions.setPinned({ ...makeEvent(true), request: makeRequest(formData) } as never)
		expect(updateTemplateSlot).toHaveBeenCalledWith({}, 5, { pinnedQuestionId: null, preferredQuestionIds: [] })
	})
})

describe('action setPreferred', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 403 si non authentifié', async () => {
		const formData = new FormData()
		formData.append('slotId', '5')
		formData.append('questionIds', '[1,2]')
		await expect(
			actions.setPreferred({ ...makeEvent(false), request: makeRequest(formData) } as never)
		).rejects.toMatchObject({ status: 403 })
	})

	it('retourne fail(400) si questionIds invalide', async () => {
		const formData = new FormData()
		formData.append('slotId', '5')
		formData.append('questionIds', 'pas-du-json')
		const result = await actions.setPreferred({ ...makeEvent(true), request: makeRequest(formData) } as never)
		expect(result).toMatchObject({ status: 400 })
	})

	it('appelle updateTemplateSlot avec le tableau parsé', async () => {
		const { updateTemplateSlot } = await import('$lib/server/db/queries/templates')
		const { insertAuditLog } = await import('$lib/server/db/queries/audit')
		const formData = new FormData()
		formData.append('slotId', '5')
		formData.append('questionIds', '[17, 42]')
		const result = await actions.setPreferred({ ...makeEvent(true), request: makeRequest(formData) } as never)
		expect(updateTemplateSlot).toHaveBeenCalledWith({}, 5, { pinnedQuestionId: null, preferredQuestionIds: [17, 42] })
		expect(insertAuditLog).toHaveBeenCalled()
		expect(result).toEqual({})
	})
})
