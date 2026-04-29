import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './+server'

vi.mock('$lib/server/db/queries/reports', () => ({
	createReport: vi.fn().mockResolvedValue(1)
}))

vi.mock('$lib/server/db/queries/questions', () => ({
	getQuestionById: vi.fn().mockResolvedValue({ id: 1, title: 'Ma question' })
}))

function makeRequest(body: unknown, ua = 'Mozilla/5.0') {
	return new Request('http://localhost/api/questions/1/report', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			...(ua ? { 'user-agent': ua } : {})
		},
		body: JSON.stringify(body)
	})
}

function makeEvent(params: Record<string, string>, body: unknown, ua = 'Mozilla/5.0') {
	return {
		params,
		request: makeRequest(body, ua),
		platform: { env: { DB: {} } }
	} as unknown as Parameters<typeof POST>[0]
}

// ──────────────────────────────────────────────────────
// Validation de base
// ──────────────────────────────────────────────────────

describe('POST /api/questions/[id]/report', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 400 si params.id non numérique', async () => {
		await expect(
			POST(makeEvent({ id: 'abc' }, { problemType: 'autre' }))
		).rejects.toMatchObject({ status: 400 })
	})

	it('retourne 400 si problemType manquant', async () => {
		await expect(
			POST(makeEvent({ id: '1' }, {}))
		).rejects.toMatchObject({ status: 400 })
	})

	it('retourne 400 si problemType invalide', async () => {
		await expect(
			POST(makeEvent({ id: '1' }, { problemType: 'inexistant' }))
		).rejects.toMatchObject({ status: 400 })
	})

	it('retourne 400 si description > 500 chars', async () => {
		await expect(
			POST(makeEvent({ id: '1' }, { problemType: 'autre', description: 'x'.repeat(501) }))
		).rejects.toMatchObject({ status: 400 })
	})

	// ──────────────────────────────────────────────────────
	// Protection anti-spam
	// ──────────────────────────────────────────────────────

	it('retourne 200 silencieux si honeypot rempli (sans appeler createReport)', async () => {
		const { createReport } = await import('$lib/server/db/queries/reports')
		const res = await POST(makeEvent({ id: '1' }, { problemType: 'autre', honeypot: 'spam' }))
		expect(res.status).toBe(200)
		expect(createReport).not.toHaveBeenCalled()
	})

	it('retourne 400 si User-Agent absent', async () => {
		await expect(
			POST(makeEvent({ id: '1' }, { problemType: 'autre' }, ''))
		).rejects.toMatchObject({ status: 400 })
	})

	it('retourne 400 si User-Agent contient "bot"', async () => {
		await expect(
			POST(makeEvent({ id: '1' }, { problemType: 'autre' }, 'Googlebot/2.1'))
		).rejects.toMatchObject({ status: 400 })
	})

	it('retourne 400 si User-Agent contient "crawler"', async () => {
		await expect(
			POST(makeEvent({ id: '1' }, { problemType: 'autre' }, 'MyCrawler/1.0'))
		).rejects.toMatchObject({ status: 400 })
	})

	// ──────────────────────────────────────────────────────
	// Question inexistante
	// ──────────────────────────────────────────────────────

	it('retourne 404 si question inexistante', async () => {
		const { getQuestionById } = await import('$lib/server/db/queries/questions')
		vi.mocked(getQuestionById).mockResolvedValueOnce(null)
		await expect(
			POST(makeEvent({ id: '99' }, { problemType: 'autre' }))
		).rejects.toMatchObject({ status: 404 })
	})

	// ──────────────────────────────────────────────────────
	// Succès
	// ──────────────────────────────────────────────────────

	it('retourne 201 et appelle createReport avec les bons args', async () => {
		const { createReport } = await import('$lib/server/db/queries/reports')
		const res = await POST(
			makeEvent({ id: '1' }, { problemType: 'enonce_incorrect', description: 'Erreur de date' })
		)
		expect(res.status).toBe(201)
		expect(createReport).toHaveBeenCalledWith({}, {
			questionId: 1,
			problemType: 'enonce_incorrect',
			description: 'Erreur de date'
		})
	})

	it('retourne 201 avec description null si absente', async () => {
		const { createReport } = await import('$lib/server/db/queries/reports')
		const res = await POST(makeEvent({ id: '1' }, { problemType: 'autre' }))
		expect(res.status).toBe(201)
		expect(createReport).toHaveBeenCalledWith({}, {
			questionId: 1,
			problemType: 'autre',
			description: null
		})
	})
})
