import { describe, it, expect, vi, beforeEach } from 'vitest'
import { noopLogger } from '$lib/server/logger'
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
			correctionMd: 'Fusées, fumigènes...',
			difficulty: 'facile',
			answerSize: 'sm',
			applicableSupports: ['deriveur', 'catamaran'],
			status: 'publie',
			sourceMd: null,
			createdAt: 1700000000,
			updatedAt: 1700000001
		},
		{
			id: 2,
			categorySlug: 'securite',
			sectionSlug: 'feux',
			title: 'Question avec source',
			questionMd: 'Quelle est la question ?',
			correctionMd: 'La réponse.',
			difficulty: 'moyen',
			answerSize: 'md',
			applicableSupports: [],
			status: 'brouillon',
			sourceMd: 'Manuel FFV p.42',
			createdAt: 1700000042,
			updatedAt: 1700000099
		}
	]),
	getStructureForExport: vi.fn().mockResolvedValue({
		supports: [{ slug: 'deriveur', displayName: 'Dériveur', enabled: true }],
		categories: [
			{
				slug: 'securite',
				displayName: 'Sécurité',
				applicableSupports: [],
				sections: [
					{
						slug: 'feux',
						displayName: 'Feux et signaux',
						applicableSupports: []
					}
				]
			}
		]
	})
}))

vi.mock('$lib/server/db/queries/templates', () => ({
	getAllTemplatesForExport: vi.fn().mockResolvedValue([
		{ id: 1, supportSlug: 'deriveur', format: 'standard', slots: [] }
	])
}))

vi.mock('$lib/server/db/queries/reports', () => ({
	getAllReportsForExport: vi.fn().mockResolvedValue([
		{
			id: 1,
			questionId: 1,
			problemType: 'enonce_incorrect',
			description: "Erreur dans l'énoncé",
			email: null,
			status: 'nouveau',
			createdAt: 1700000000
		}
	])
}))

const mockR2 = {
	list: vi.fn().mockResolvedValue({
		objects: [{ key: '1/images/schema.png' }],
		truncated: false
	}),
	get: vi.fn().mockResolvedValue({ arrayBuffer: () => Promise.resolve(new ArrayBuffer(4)) })
}

function makeEvent(isAdmin: boolean) {
	return {
		locals: { isAdmin, logger: noopLogger, requestId: 'test' },
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

	it('le ZIP contient templates.json, structure.json et le fichier de la question', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const keys = Object.keys(zip)
		expect(keys).toContain('templates.json')
		expect(keys).toContain('structure.json')
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

	it('le frontmatter contient difficulty, answerSize et applicableSupports', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const qKey = Object.keys(zip).find((k) => k.includes('/1/'))!
		const content = new TextDecoder().decode(zip[qKey])
		expect(content).toMatch(/^---\n/)
		expect(content).toContain('difficulty: facile')
		expect(content).toContain('answerSize: sm')
		expect(content).toContain('applicableSupports: [deriveur, catamaran]')
	})

	it('le frontmatter contient status, createdAt et updatedAt', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const qKey = Object.keys(zip).find((k) => k.includes('/1/'))!
		const content = new TextDecoder().decode(zip[qKey])
		expect(content).toContain('status: publie')
		expect(content).toContain('createdAt: 1700000000')
		expect(content).toContain('updatedAt: 1700000001')
	})

	it('le ZIP contient reports.json', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		expect(Object.keys(zip)).toContain('reports.json')
	})

	it('reports.json contient les données mockées', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const reports = JSON.parse(new TextDecoder().decode(zip['reports.json']))
		expect(reports).toHaveLength(1)
		expect(reports[0].id).toBe(1)
		expect(reports[0].problemType).toBe('enonce_incorrect')
	})

	it('le frontmatter avec applicableSupports vide contient []', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const qKey = Object.keys(zip).find((k) => k.includes('/2/'))!
		const content = new TextDecoder().decode(zip[qKey])
		expect(content).toContain('applicableSupports: []')
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

	it('la clé ZIP des images est hiérarchique même si R2 est plat', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const imgKey = Object.keys(zip).find((k) => k.endsWith('.png'))!
		expect(imgKey).toBe('securite/feux/1/images/schema.png')
	})

	it('structure.json contient les catégories et sections avec métadonnées', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const structure = JSON.parse(new TextDecoder().decode(zip['structure.json']))
		expect(structure.categories).toHaveLength(1)
		expect(structure.categories[0].slug).toBe('securite')
		expect(structure.categories[0].displayName).toBe('Sécurité')
		expect(structure.categories[0].sections).toHaveLength(1)
		expect(structure.categories[0].sections[0].slug).toBe('feux')
	})

	it('structure.json contient les supports', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const structure = JSON.parse(new TextDecoder().decode(zip['structure.json']))
		expect(structure.supports).toHaveLength(1)
		expect(structure.supports[0].slug).toBe('deriveur')
		expect(structure.supports[0].displayName).toBe('Dériveur')
		expect(structure.supports[0].enabled).toBe(true)
	})

	it('le markdown de la question inclut sourceMd quand non null', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const qKey = Object.keys(zip).find((k) => k.endsWith('.md') && k.includes('/2/'))!
		const content = new TextDecoder().decode(zip[qKey])
		expect(content).toContain('<small>Manuel FFV p.42</small>')
	})

	it('le markdown de la question sans source ne contient pas de balise small', async () => {
		const response = await GET(makeEvent(true))
		const buf = await response.arrayBuffer()
		const zip = unzipSync(new Uint8Array(buf))
		const qKey = Object.keys(zip).find((k) => k.endsWith('.md') && k.includes('/1/'))!
		const content = new TextDecoder().decode(zip[qKey])
		expect(content).not.toContain('<small>')
	})
})
