import { describe, it, expect } from 'vitest'
import { zipSync, strToU8 } from 'fflate'
import { parseZip } from './parse-zip'
import type { StructureJson } from './parse-zip'
import { buildQuestionFileContent, buildQuestionFilePath } from '$lib/server/export/question-file'
import type { QuestionExportRow } from '$lib/server/db/queries/questions'
import { generateQuestionsSql } from './generate-sql'

const STRUCTURE: StructureJson = {
	supports: [
		{ slug: 'deriveur', displayName: 'Dériveur', enabled: true },
		{ slug: 'catamaran', displayName: 'Catamaran', enabled: true }
	],
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

describe('roundtrip export → parse', () => {
	it('préserve difficulty, answerSize et applicableSupports non vides', () => {
		const q: QuestionExportRow = {
			id: 42,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: 'Le vent',
			questionMd: 'Définition du vent',
			correctionMd: 'Mouvement de l\'air',
			difficulty: 'facile' as const,
			answerSize: 'sm' as const,
			applicableSupports: ['deriveur', 'catamaran'],
			sourceMd: null
		}

		const zip = zipSync({
			'structure.json': strToU8(JSON.stringify(STRUCTURE)),
			'templates.json': strToU8(JSON.stringify(TEMPLATES)),
			[buildQuestionFilePath(q)]: strToU8(buildQuestionFileContent(q))
		})

		const result = parseZip(zip)
		expect(result.questions).toHaveLength(1)
		const parsed = result.questions[0]
		expect(parsed.difficulty).toBe('facile')
		expect(parsed.answerSize).toBe('sm')
		expect(parsed.applicableSupports).toEqual(['deriveur', 'catamaran'])
		expect(parsed.title).toBe('Le vent')
		expect(parsed.questionMd).toBe('Définition du vent')
		expect(parsed.correctionMd).toBe('Mouvement de l\'air')
		expect(parsed.sourceMd).toBeNull()
	})

	it('préserve applicableSupports vide (tous supports)', () => {
		const q: QuestionExportRow = {
			id: 1,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: 'Question générale',
			questionMd: 'Q',
			correctionMd: 'R',
			difficulty: 'moyen' as const,
			answerSize: 'md' as const,
			applicableSupports: [],
			sourceMd: null
		}

		const zip = zipSync({
			'structure.json': strToU8(JSON.stringify(STRUCTURE)),
			'templates.json': strToU8(JSON.stringify(TEMPLATES)),
			[buildQuestionFilePath(q)]: strToU8(buildQuestionFileContent(q))
		})

		const result = parseZip(zip)
		expect(result.questions[0].applicableSupports).toEqual([])
		expect(result.questions[0].difficulty).toBe('moyen')
		expect(result.questions[0].answerSize).toBe('md')
	})

	it('préserve sourceMd à travers le cycle', () => {
		const q: QuestionExportRow = {
			id: 5,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: 'Anticyclone',
			questionMd: 'Qu\'est-ce qu\'un anticyclone ?',
			correctionMd: 'Zone de haute pression',
			difficulty: 'difficile' as const,
			answerSize: 'lg' as const,
			applicableSupports: ['deriveur'],
			sourceMd: 'Manuel FFV p.42'
		}

		const zip = zipSync({
			'structure.json': strToU8(JSON.stringify(STRUCTURE)),
			'templates.json': strToU8(JSON.stringify(TEMPLATES)),
			[buildQuestionFilePath(q)]: strToU8(buildQuestionFileContent(q))
		})

		const result = parseZip(zip)
		const parsed = result.questions[0]
		expect(parsed.sourceMd).toBe('Manuel FFV p.42')
		expect(parsed.difficulty).toBe('difficile')
		expect(parsed.answerSize).toBe('lg')
		expect(parsed.applicableSupports).toEqual(['deriveur'])
	})

	it('gère les apostrophes dans le contenu sans corrompre le parsing', () => {
		const q: QuestionExportRow = {
			id: 7,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: "Qu'est-ce que l'isobare ?",
			questionMd: "Définition de l'isobare.",
			correctionMd: "Ligne d'égale pression.",
			difficulty: 'moyen' as const,
			answerSize: 'md' as const,
			applicableSupports: ['catamaran'],
			sourceMd: null
		}

		const zip = zipSync({
			'structure.json': strToU8(JSON.stringify(STRUCTURE)),
			'templates.json': strToU8(JSON.stringify(TEMPLATES)),
			[buildQuestionFilePath(q)]: strToU8(buildQuestionFileContent(q))
		})

		const result = parseZip(zip)
		const parsed = result.questions[0]
		expect(parsed.title).toBe("Qu'est-ce que l'isobare ?")
		expect(parsed.applicableSupports).toEqual(['catamaran'])
	})

	it('parse plusieurs questions indépendamment', () => {
		const questions: QuestionExportRow[] = [
			{
				id: 10,
				categorySlug: 'meteo',
				sectionSlug: 'carte_meteo',
				title: 'Q1',
				questionMd: 'Q1 texte',
				correctionMd: 'R1',
				difficulty: 'facile' as const,
				answerSize: 'xs' as const,
				applicableSupports: ['deriveur'],
				sourceMd: null
			},
			{
				id: 11,
				categorySlug: 'meteo',
				sectionSlug: 'carte_meteo',
				title: 'Q2',
				questionMd: 'Q2 texte',
				correctionMd: 'R2',
				difficulty: 'difficile' as const,
				answerSize: 'lg' as const,
				applicableSupports: [],
				sourceMd: null
			}
		]

		const files: Record<string, Uint8Array> = {
			'structure.json': strToU8(JSON.stringify(STRUCTURE)),
			'templates.json': strToU8(JSON.stringify(TEMPLATES))
		}
		for (const q of questions) {
			files[buildQuestionFilePath(q)] = strToU8(buildQuestionFileContent(q))
		}

		const result = parseZip(zipSync(files))
		expect(result.questions).toHaveLength(2)

		const q10 = result.questions.find((q) => q.id === 10)!
		expect(q10.difficulty).toBe('facile')
		expect(q10.answerSize).toBe('xs')
		expect(q10.applicableSupports).toEqual(['deriveur'])

		const q11 = result.questions.find((q) => q.id === 11)!
		expect(q11.difficulty).toBe('difficile')
		expect(q11.answerSize).toBe('lg')
		expect(q11.applicableSupports).toEqual([])
	})
})

function makeZip(questions: QuestionExportRow[]) {
	const files: Record<string, Uint8Array> = {
		'structure.json': strToU8(JSON.stringify(STRUCTURE)),
		'templates.json': strToU8(JSON.stringify(TEMPLATES))
	}
	for (const q of questions) {
		files[buildQuestionFilePath(q)] = strToU8(buildQuestionFileContent(q))
	}
	return zipSync(files)
}

describe('roundtrip export → parse → SQL', () => {
	it('le SQL généré contient difficulty, answerSize et applicableSupports réels', () => {
		const q: QuestionExportRow = {
			id: 42,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: 'Le vent',
			questionMd: 'Définition du vent',
			correctionMd: 'Mouvement de l\'air',
			difficulty: 'facile',
			answerSize: 'sm',
			applicableSupports: ['deriveur', 'catamaran'],
			sourceMd: null
		}

		const { questions } = parseZip(makeZip([q]))
		const sql = generateQuestionsSql(questions)

		expect(sql).toContain("'facile'")
		expect(sql).toContain("'sm'")
		expect(sql).toContain('["deriveur","catamaran"]')
		expect(sql).not.toContain("'moyen'")
		expect(sql).not.toContain("'md'")
		expect(sql).not.toContain("'[]'")
	})

	it('le SQL préserve applicableSupports vide comme []', () => {
		const q: QuestionExportRow = {
			id: 1,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: 'Question générale',
			questionMd: 'Q',
			correctionMd: 'R',
			difficulty: 'moyen',
			answerSize: 'md',
			applicableSupports: [],
			sourceMd: null
		}

		const { questions } = parseZip(makeZip([q]))
		const sql = generateQuestionsSql(questions)

		expect(sql).toContain("'[]'")
	})

	it('le SQL échappe correctement les apostrophes dans le contenu', () => {
		const q: QuestionExportRow = {
			id: 7,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: "Qu'est-ce que l'isobare ?",
			questionMd: "Définition de l'isobare.",
			correctionMd: "Ligne d'égale pression.",
			difficulty: 'moyen',
			answerSize: 'md',
			applicableSupports: ['catamaran'],
			sourceMd: null
		}

		const { questions } = parseZip(makeZip([q]))
		const sql = generateQuestionsSql(questions)

		expect(sql).toContain("Qu''est-ce que l''isobare")
		expect(sql).toContain("Définition de l''isobare")
		expect(sql).toContain("Ligne d''égale pression")
	})

	it('le SQL contient un INSERT par question', () => {
		const questions: QuestionExportRow[] = [
			{ id: 10, categorySlug: 'meteo', sectionSlug: 'carte_meteo', title: 'Q1', questionMd: 'Q', correctionMd: 'R', difficulty: 'facile', answerSize: 'xs', applicableSupports: [], sourceMd: null },
			{ id: 11, categorySlug: 'meteo', sectionSlug: 'carte_meteo', title: 'Q2', questionMd: 'Q', correctionMd: 'R', difficulty: 'difficile', answerSize: 'lg', applicableSupports: ['deriveur'], sourceMd: null }
		]

		const { questions: parsed } = parseZip(makeZip(questions))
		const sql = generateQuestionsSql(parsed)

		expect((sql.match(/INSERT INTO questions/g) ?? []).length).toBe(2)
		expect(sql).toContain("'facile'")
		expect(sql).toContain("'difficile'")
	})
})
