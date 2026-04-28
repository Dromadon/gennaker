import { describe, it, expect } from 'vitest'
import { generateStructureSql, generateQuestionsSql, generateTemplatesSql } from './generate-sql'
import type { StructureJson, ParsedQuestion } from './parse-zip'

const STRUCTURE: StructureJson = {
	supports: [
		{ slug: 'deriveur', displayName: 'Dériveur', enabled: true },
		{ slug: 'catamaran', displayName: 'Catamaran', enabled: false }
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

describe('generateStructureSql', () => {
	it('génère des INSERT pour supports, categories et sections', () => {
		const sql = generateStructureSql(STRUCTURE)
		expect(sql).toContain('INSERT INTO supports')
		expect(sql).toContain('INSERT INTO categories')
		expect(sql).toContain('INSERT INTO sections')
	})

	it('utilise ON CONFLICT pour l\'idempotence', () => {
		const sql = generateStructureSql(STRUCTURE)
		const occurrences = (sql.match(/ON CONFLICT/g) ?? []).length
		// 2 supports + 1 category + 1 section = 4
		expect(occurrences).toBe(4)
	})

	it('encode le support désactivé avec enabled=0', () => {
		const sql = generateStructureSql(STRUCTURE)
		expect(sql).toContain("'catamaran', 'Catamaran', 0")
	})

	it('utilise subquery pour category_id dans sections', () => {
		const sql = generateStructureSql(STRUCTURE)
		expect(sql).toContain("SELECT id FROM categories WHERE slug='meteo'")
	})

	it('échappe les apostrophes dans les valeurs', () => {
		const structure: StructureJson = {
			supports: [],
			categories: [
				{
					slug: 'nav',
					displayName: "Navigation de l'île",
					applicableSupports: [],
					sections: []
				}
			]
		}
		const sql = generateStructureSql(structure)
		expect(sql).toContain("Navigation de l''île")
	})
})

describe('generateQuestionsSql', () => {
	const questions: ParsedQuestion[] = [
		{
			id: 1,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: 'Qu\'est-ce que le vent ?',
			questionMd: 'Définition du vent',
			correctionMd: 'Mouvement de l\'air',
			sourceMd: null
		},
		{
			id: 2,
			categorySlug: 'meteo',
			sectionSlug: 'carte_meteo',
			title: 'Anticyclone',
			questionMd: 'Qu\'est-ce qu\'un anticyclone ?',
			correctionMd: 'Zone de haute pression',
			sourceMd: 'Manuel p.12'
		}
	]

	it('génère des INSERT pour chaque question', () => {
		const sql = generateQuestionsSql(questions)
		const count = (sql.match(/INSERT INTO questions/g) ?? []).length
		expect(count).toBe(2)
	})

	it('utilise subquery pour section_id', () => {
		const sql = generateQuestionsSql(questions)
		expect(sql).toContain("SELECT id FROM sections WHERE slug='carte_meteo'")
	})

	it('utilise ON CONFLICT(id) pour l\'idempotence', () => {
		const sql = generateQuestionsSql(questions)
		expect(sql).toContain('ON CONFLICT(id)')
	})

	it('met NULL pour sourceMd null', () => {
		const sql = generateQuestionsSql([questions[0]])
		expect(sql).toContain(', NULL,')
	})

	it('inclut sourceMd quand non null', () => {
		const sql = generateQuestionsSql([questions[1]])
		expect(sql).toContain("'Manuel p.12'")
	})
})

describe('generateTemplatesSql', () => {
	const templates = [
		{
			id: 1,
			supportSlug: 'deriveur',
			format: 'standard',
			slots: [
				{
					id: 10,
					sectionId: 1,
					sectionSlug: 'carte_meteo',
					position: 1,
					questionCount: 2,
					difficultyFilter: 'any',
					pinnedQuestionId: null,
					preferredQuestionIds: '[]'
				}
			]
		}
	]

	it('génère INSERT pour evaluation_templates', () => {
		const sql = generateTemplatesSql(templates)
		expect(sql).toContain('INSERT INTO evaluation_templates')
		expect(sql).toContain("'deriveur', 'standard'")
	})

	it('génère INSERT pour template_slots', () => {
		const sql = generateTemplatesSql(templates)
		expect(sql).toContain('INSERT INTO template_slots')
	})

	it('utilise subquery pour template_id et section_id', () => {
		const sql = generateTemplatesSql(templates)
		expect(sql).toContain("SELECT id FROM evaluation_templates WHERE support_slug='deriveur'")
		expect(sql).toContain("SELECT id FROM sections WHERE slug='carte_meteo'")
	})

	it('met NULL pour pinnedQuestionId null', () => {
		const sql = generateTemplatesSql(templates)
		expect(sql).toContain(', NULL,')
	})
})
