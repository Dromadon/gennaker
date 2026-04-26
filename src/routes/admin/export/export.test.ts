import { describe, it, expect, vi, beforeEach } from 'vitest'
import { unzipSync } from 'fflate'
import { GET } from './+server'

vi.mock('$lib/server/db/queries/questions', () => ({
	getAllQuestionsForExport: vi.fn().mockResolvedValue([
		{
			id: 1,
			categorySlug: 'securite',
			sectionSlug: 'feux',
			title: 'Signaux de détresse',
			questionMd: 'Quels sont les signaux de détresse ?',
			correctionMd: 'Fusées, fumigènes...'
		}
	])
}))

vi.mock('$lib/server/db/queries/templates', () => ({
	getAllTemplatesForExport: vi.fn().mockResolvedValue([
		{ id: 1, supportSlug: 'deriveur', format: 'standard', slots: [] }
	])
}))

const mockR2 = {
	list: vi.fn().mockResolvedValue({
		objects: [{ key: 'securite/feux/1/images/schema.png' }],
		truncated: false
	}),
	get: vi.fn().mockResolvedValue({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) })
}

function makeEvent(isAdmin: boolean) {
	return {
		locals: { isAdmin },
		platform: { env: { DB: {}, IMAGES: mockR2 } }
	} as unknown as Parameters<typeof GET>[0]
}

describe('GET /admin/export', () => {
	beforeEach(() => vi.clearAllMocks())

	it('refuse si non authentifié (403)', async () => {
		await expect(GET(makeEvent(false))).rejects.toMatchObject({ status: 403 })
	})

	it('retourne 200 avec Content-Disposition attachment', async () => {
		const response = await GET(makeEvent(true))
		expect(response.status).toBe(200)
		expect(response.headers.get('Content-Disposition')).toMatch(/attachment.*\.zip/)
	})

	it('le ZIP contient templates.json et le fichier de la question', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const keys = Object.keys(zip)
		expect(keys).toContain('templates.json')
		expect(keys.some((k) => k.endsWith('.md'))).toBe(true)
	})

	it('templates.json contient les données mockées', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const templates = JSON.parse(new TextDecoder().decode(zip['templates.json']))
		expect(templates[0].supportSlug).toBe('deriveur')
	})

	it('le fichier question contient titre et correction', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const qKey = Object.keys(zip).find((k) => k.endsWith('.md'))!
		const content = new TextDecoder().decode(zip[qKey])
		expect(content).toContain('Signaux de détresse')
		expect(content).toContain('# Correction')
	})

	it('le ZIP contient les images dans un sous-dossier images/', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		expect(Object.keys(zip).some((k) => k.includes('/images/') && k.endsWith('.png'))).toBe(true)
	})

	it("l'image et son markdown sont dans le même répertoire parent", async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const imgKey = Object.keys(zip).find((k) => k.endsWith('.png'))!
		const mdKey = Object.keys(zip).find((k) => k.endsWith('.md'))!
		const imgDir = imgKey.split('/').slice(0, -2).join('/')
		const mdDir = mdKey.split('/').slice(0, -1).join('/')
		expect(imgDir).toBe(mdDir)
	})
})
