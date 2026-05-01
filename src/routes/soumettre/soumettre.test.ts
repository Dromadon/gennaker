import { describe, it, expect, vi, beforeEach } from 'vitest'
import { actions } from './+page.server'

vi.mock('$lib/server/db/queries/submissions', () => ({
	createCommunitySubmission: vi.fn().mockResolvedValue(1)
}))

vi.mock('$lib/server/db/queries/categories', () => ({
	getAllCategoriesWithSections: vi.fn().mockResolvedValue([])
}))

const VALID_BODY: Record<string, string | string[]> = {
	title: 'Définition du vent apparent',
	sectionId: '2',
	questionMd: 'Qu\'est-ce que le vent apparent ?',
	correctionMd: 'Le vent apparent est la résultante du vent réel et du vent propre.',
	applicableSupports: ['deriveur', 'catamaran'],
	submitterName: 'Jean Dupont',
	submitterEmail: 'jean@example.com'
}

function makeFormData(fields: Record<string, string | string[]>) {
	const fd = new FormData()
	for (const [key, value] of Object.entries(fields)) {
		if (Array.isArray(value)) {
			for (const v of value) fd.append(key, v)
		} else {
			fd.append(key, value)
		}
	}
	return fd
}

function makeEvent(fields: Record<string, string | string[]>, ua = 'Mozilla/5.0') {
	return {
		request: {
			headers: { get: (h: string) => (h === 'user-agent' ? ua : null) },
			formData: () => Promise.resolve(makeFormData(fields))
		},
		platform: { env: { DB: {} } }
	} as unknown as Parameters<typeof actions.submit>[0]
}

describe('POST /soumettre', () => {
	beforeEach(() => vi.clearAllMocks())

	// ── Anti-spam ──────────────────────────────────────────

	it('retourne succès silencieux si honeypot rempli (sans appeler createCommunitySubmission)', async () => {
		const { createCommunitySubmission } = await import('$lib/server/db/queries/submissions')
		const result = await actions.submit(makeEvent({ ...VALID_BODY, honeypot: 'spam' }))
		expect(result).toMatchObject({ success: true })
		expect(createCommunitySubmission).not.toHaveBeenCalled()
	})

	it('retourne succès silencieux si User-Agent absent', async () => {
		const { createCommunitySubmission } = await import('$lib/server/db/queries/submissions')
		const result = await actions.submit(makeEvent(VALID_BODY, ''))
		expect(result).toMatchObject({ success: true })
		expect(createCommunitySubmission).not.toHaveBeenCalled()
	})

	it('retourne succès silencieux si User-Agent de bot', async () => {
		const { createCommunitySubmission } = await import('$lib/server/db/queries/submissions')
		const result = await actions.submit(makeEvent(VALID_BODY, 'Googlebot/2.1'))
		expect(result).toMatchObject({ success: true })
		expect(createCommunitySubmission).not.toHaveBeenCalled()
	})

	// ── Validation ─────────────────────────────────────────

	it('retourne 422 si titre absent', async () => {
		const { title: _, ...body } = VALID_BODY
		const result = await actions.submit(makeEvent(body))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si titre > 120 caractères', async () => {
		const result = await actions.submit(makeEvent({ ...VALID_BODY, title: 'x'.repeat(121) }))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si sectionId absent', async () => {
		const { sectionId: _, ...body } = VALID_BODY
		const result = await actions.submit(makeEvent(body))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si questionMd absent', async () => {
		const { questionMd: _, ...body } = VALID_BODY
		const result = await actions.submit(makeEvent(body))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si correctionMd absent', async () => {
		const { correctionMd: _, ...body } = VALID_BODY
		const result = await actions.submit(makeEvent(body))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si aucun support sélectionné', async () => {
		const { applicableSupports: _, ...body } = VALID_BODY
		const result = await actions.submit(makeEvent(body))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si support invalide', async () => {
		const result = await actions.submit(makeEvent({ ...VALID_BODY, applicableSupports: ['inconnu'] }))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si submitterName absent', async () => {
		const { submitterName: _, ...body } = VALID_BODY
		const result = await actions.submit(makeEvent(body))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si submitterEmail absent', async () => {
		const { submitterEmail: _, ...body } = VALID_BODY
		const result = await actions.submit(makeEvent(body))
		expect(result).toMatchObject({ status: 422 })
	})

	it('retourne 422 si submitterEmail invalide', async () => {
		const result = await actions.submit(makeEvent({ ...VALID_BODY, submitterEmail: 'pas-un-email' }))
		expect(result).toMatchObject({ status: 422 })
	})

	// ── Succès ─────────────────────────────────────────────

	it('retourne success:true et appelle createCommunitySubmission avec les bonnes données', async () => {
		const { createCommunitySubmission } = await import('$lib/server/db/queries/submissions')
		const result = await actions.submit(makeEvent(VALID_BODY))
		expect(result).toMatchObject({ success: true })
		expect(createCommunitySubmission).toHaveBeenCalledWith({}, {
			sectionId: 2,
			title: 'Définition du vent apparent',
			questionMd: 'Qu\'est-ce que le vent apparent ?',
			correctionMd: 'Le vent apparent est la résultante du vent réel et du vent propre.',
			applicableSupports: ['deriveur', 'catamaran'],
			submitterName: 'Jean Dupont',
			submitterEmail: 'jean@example.com'
		})
	})

	it('retourne success:true avec un seul support', async () => {
		const { createCommunitySubmission } = await import('$lib/server/db/queries/submissions')
		const result = await actions.submit(makeEvent({ ...VALID_BODY, applicableSupports: ['windsurf'] }))
		expect(result).toMatchObject({ success: true })
		expect(createCommunitySubmission).toHaveBeenCalledWith(
			{},
			expect.objectContaining({ applicableSupports: ['windsurf'] })
		)
	})
})
