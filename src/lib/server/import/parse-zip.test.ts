import { describe, it, expect } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import { parseQuestionMarkdown, parseZip } from './parse-zip'
import type { StructureJson } from './parse-zip'

const STRUCTURE: StructureJson = {
	supports: [{ slug: 'deriveur', displayName: 'Dériveur', enabled: true }],
	categories: [
		{
			slug: 'meteo',
			displayName: 'Météo',
			applicableSupports: [],
			sections: [{ slug: 'carte_meteo', displayName: 'Carte météo', applicableSupports: [] }]
		}
	]
}

const TEMPLATES = [{ id: 1, supportSlug: 'deriveur', format: 'standard', slots: [] }]

function makeZip(extras: Record<string, Uint8Array> = {}) {
	return zipSync({
		'structure.json': strToU8(JSON.stringify(STRUCTURE)),
		'templates.json': strToU8(JSON.stringify(TEMPLATES)),
		...extras
	})
}

describe('parseQuestionMarkdown', () => {
	it('extrait titre, question et correction', () => {
		const md = '# Mon titre\n\nTexte question\n\n# Correction\n\nTexte correction\n'
		const result = parseQuestionMarkdown(md)
		expect(result.title).toBe('Mon titre')
		expect(result.questionMd).toBe('Texte question')
		expect(result.correctionMd).toBe('Texte correction')
		expect(result.sourceMd).toBeNull()
	})

	it('sans section Correction, met tout dans questionMd', () => {
		const md = '# Titre\n\nContenu sans correction\n'
		const result = parseQuestionMarkdown(md)
		expect(result.title).toBe('Titre')
		expect(result.questionMd).toBe('Contenu sans correction')
		expect(result.correctionMd).toBe('')
		expect(result.sourceMd).toBeNull()
	})

	it('extrait sourceMd depuis <small> en fin de correction', () => {
		const md = '# Titre\n\nQuestion\n\n# Correction\n\nCorrection\n\n<small>Manuel FFV p.42</small>\n'
		const result = parseQuestionMarkdown(md)
		expect(result.correctionMd).toBe('Correction')
		expect(result.sourceMd).toBe('Manuel FFV p.42')
	})

	it('titre avec espaces multiples après #', () => {
		const md = '#  Titre direct  \n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.title).toBe('Titre direct')
	})

	it('sans frontmatter, retourne les valeurs par défaut', () => {
		const md = '# Titre\n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.difficulty).toBe('moyen')
		expect(result.answerSize).toBe('md')
		expect(result.applicableSupports).toEqual([])
	})

	it('parse le frontmatter avec applicableSupports non vide', () => {
		const md =
			'---\ndifficulty: facile\nanswerSize: sm\napplicableSupports: [deriveur, catamaran]\n---\n\n# Titre\n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.difficulty).toBe('facile')
		expect(result.answerSize).toBe('sm')
		expect(result.applicableSupports).toEqual(['deriveur', 'catamaran'])
		expect(result.title).toBe('Titre')
	})

	it('parse le frontmatter avec applicableSupports vide', () => {
		const md =
			'---\ndifficulty: difficile\nanswerSize: lg\napplicableSupports: []\n---\n\n# Titre\n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.difficulty).toBe('difficile')
		expect(result.answerSize).toBe('lg')
		expect(result.applicableSupports).toEqual([])
	})

	it('frontmatter avec valeur difficulty invalide → valeur par défaut', () => {
		const md =
			'---\ndifficulty: ultra\nanswerSize: md\napplicableSupports: []\n---\n\n# Titre\n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.difficulty).toBe('moyen')
	})

	it('sans frontmatter, retourne status publie et timestamps null', () => {
		const md = '# Titre\n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.status).toBe('publie')
		expect(result.createdAt).toBeNull()
		expect(result.updatedAt).toBeNull()
	})

	it('parse status: brouillon depuis le frontmatter', () => {
		const md =
			'---\nstatus: brouillon\ndifficulty: moyen\nanswerSize: md\napplicableSupports: []\ncreatedAt: 1700000000\nupdatedAt: 1700000001\n---\n\n# Titre\n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.status).toBe('brouillon')
	})

	it('parse createdAt et updatedAt depuis le frontmatter', () => {
		const md =
			'---\nstatus: publie\ndifficulty: moyen\nanswerSize: md\napplicableSupports: []\ncreatedAt: 1700000042\nupdatedAt: 1700000099\n---\n\n# Titre\n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.createdAt).toBe(1700000042)
		expect(result.updatedAt).toBe(1700000099)
	})

	it('frontmatter avec status invalide → valeur par défaut publie', () => {
		const md =
			'---\nstatus: inconnu\ndifficulty: moyen\nanswerSize: md\napplicableSupports: []\n---\n\n# Titre\n\nQ\n\n# Correction\n\nC\n'
		const result = parseQuestionMarkdown(md)
		expect(result.status).toBe('publie')
	})
})

describe('parseZip', () => {
	it('lève une erreur si structure.json manquant', () => {
		const zip = zipSync({ 'templates.json': strToU8('[]') })
		expect(() => parseZip(zip)).toThrow('structure.json manquant')
	})

	it('lève une erreur si templates.json manquant', () => {
		const zip = zipSync({ 'structure.json': strToU8(JSON.stringify(STRUCTURE)) })
		expect(() => parseZip(zip)).toThrow('templates.json manquant')
	})

	it('lève une erreur si structure.json sans supports', () => {
		const badStructure = { categories: [] }
		const zip = zipSync({
			'structure.json': strToU8(JSON.stringify(badStructure)),
			'templates.json': strToU8('[]')
		})
		expect(() => parseZip(zip)).toThrow('supports')
	})

	it('parse les questions depuis les fichiers .md', () => {
		const md = '# Titre question\n\nTexte Q\n\n# Correction\n\nTexte R\n'
		const zip = makeZip({ 'meteo/carte_meteo/42/Titre question.md': strToU8(md) })
		const result = parseZip(zip)
		expect(result.questions).toHaveLength(1)
		expect(result.questions[0].id).toBe(42)
		expect(result.questions[0].categorySlug).toBe('meteo')
		expect(result.questions[0].sectionSlug).toBe('carte_meteo')
		expect(result.questions[0].title).toBe('Titre question')
	})

	it('parse les images', () => {
		const imgData = new Uint8Array([1, 2, 3, 4])
		const zip = makeZip({ 'meteo/carte_meteo/42/images/schema.png': imgData })
		const result = parseZip(zip)
		expect(result.images).toHaveLength(1)
		expect(result.images[0].questionId).toBe(42)
		expect(result.images[0].filename).toBe('schema.png')
	})

	it('retourne structure et templates parsés', () => {
		const zip = makeZip()
		const result = parseZip(zip)
		expect(result.structure.supports).toHaveLength(1)
		expect(result.templates).toHaveLength(1)
		expect(result.templates[0].supportSlug).toBe('deriveur')
	})

	it('retourne reports vide si reports.json absent (rétrocompatibilité)', () => {
		const zip = makeZip()
		const result = parseZip(zip)
		expect(result.reports).toEqual([])
	})

	it('parse reports.json si présent', () => {
		const reports = [
			{
				id: 1,
				questionId: 42,
				problemType: 'enonce_incorrect',
				description: 'Erreur dans l\'énoncé',
				email: null,
				status: 'nouveau',
				createdAt: 1700000000
			}
		]
		const zip = makeZip({ 'reports.json': strToU8(JSON.stringify(reports)) })
		const result = parseZip(zip)
		expect(result.reports).toHaveLength(1)
		expect(result.reports[0].id).toBe(1)
		expect(result.reports[0].questionId).toBe(42)
		expect(result.reports[0].problemType).toBe('enonce_incorrect')
		expect(result.reports[0].status).toBe('nouveau')
	})
})
