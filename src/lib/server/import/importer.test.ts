import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { importZip } from './importer'
import type { ImportSubset } from './importer'
import { getDbFromSqlite } from './importer-test-utils'
import { zipSync, strToU8 } from 'fflate'
import { buildQuestionFileContent, buildQuestionFilePath } from '$lib/server/export/question-file'
import type { QuestionExportRow } from '$lib/server/db/queries/questions'
import {
	supports as supportsTable,
	categories as categoriesTable,
	sections as sectionsTable,
	questions as questionsTable,
	evaluationTemplates,
	templateSlots,
	questionReports as questionReportsTable
} from '$lib/server/db/schema'

// ── Helpers ───────────────────────────────────────────────────────────────────

function createTestDb() {
	const sqlite = new Database(':memory:')
	sqlite.exec(`
		CREATE TABLE supports (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			display_name TEXT NOT NULL,
			enabled INTEGER NOT NULL DEFAULT 1
		);
		CREATE TABLE categories (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			slug TEXT NOT NULL UNIQUE,
			display_name TEXT NOT NULL,
			applicable_supports TEXT NOT NULL DEFAULT '[]'
		);
		CREATE TABLE sections (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			category_id INTEGER NOT NULL REFERENCES categories(id),
			slug TEXT NOT NULL,
			display_name TEXT NOT NULL,
			applicable_supports TEXT NOT NULL DEFAULT '[]'
		);
		CREATE UNIQUE INDEX sections_category_slug_unique ON sections (category_id, slug);
		CREATE TABLE questions (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			section_id INTEGER NOT NULL REFERENCES sections(id),
			title TEXT NOT NULL,
			question_md TEXT NOT NULL,
			correction_md TEXT NOT NULL,
			difficulty TEXT NOT NULL DEFAULT 'moyen',
			answer_size TEXT NOT NULL DEFAULT 'md',
			applicable_supports TEXT NOT NULL DEFAULT '[]',
			status TEXT NOT NULL DEFAULT 'brouillon',
			source_md TEXT,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
		CREATE TABLE evaluation_templates (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			support_slug TEXT NOT NULL REFERENCES supports(slug),
			format TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
		CREATE UNIQUE INDEX evaluation_templates_support_format_unique ON evaluation_templates (support_slug, format);
		CREATE TABLE template_slots (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			template_id INTEGER NOT NULL REFERENCES evaluation_templates(id),
			section_id INTEGER NOT NULL REFERENCES sections(id),
			position INTEGER NOT NULL,
			question_count INTEGER NOT NULL,
			pinned_question_id INTEGER REFERENCES questions(id),
			preferred_question_ids TEXT NOT NULL DEFAULT '[]'
		);
		CREATE UNIQUE INDEX template_slots_template_position_unique ON template_slots (template_id, position);
		CREATE TABLE shared_evaluations (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			short_code TEXT NOT NULL UNIQUE,
			support_slug TEXT NOT NULL,
			format TEXT NOT NULL,
			slots_json TEXT NOT NULL,
			created_at INTEGER NOT NULL,
			expires_at INTEGER NOT NULL
		);
		CREATE TABLE question_reports (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			question_id INTEGER NOT NULL REFERENCES questions(id),
			problem_type TEXT NOT NULL,
			description TEXT,
			email TEXT,
			status TEXT NOT NULL DEFAULT 'nouveau',
			created_at INTEGER NOT NULL
		);
		CREATE TABLE community_submissions (
			id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
			type TEXT NOT NULL,
			section_id INTEGER REFERENCES sections(id),
			question_id INTEGER REFERENCES questions(id),
			title TEXT,
			question_md TEXT,
			correction_md TEXT,
			source_md TEXT,
			problem_description TEXT,
			submitter_email TEXT,
			status TEXT NOT NULL DEFAULT 'en_attente',
			created_at INTEGER NOT NULL,
			reviewed_at INTEGER
		);
	`)
	return getDbFromSqlite(sqlite)
}

const STRUCTURE = {
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

const TEMPLATES = [
	{
		id: 1,
		supportSlug: 'deriveur',
		format: 'standard',
		slots: [
			{
				id: 10,
				categorySlug: 'meteo',
				sectionSlug: 'carte_meteo',
				position: 1,
				questionCount: 3,
				pinnedQuestionId: null,
				preferredQuestionIds: '[]'
			}
		]
	}
]

function makeQuestion(overrides: Partial<QuestionExportRow> = {}): QuestionExportRow {
	return {
		id: 42,
		categorySlug: 'meteo',
		sectionSlug: 'carte_meteo',
		title: 'Le vent',
		questionMd: 'Définition du vent',
		correctionMd: "Mouvement de l'air",
		difficulty: 'facile',
		answerSize: 'sm',
		applicableSupports: ['deriveur', 'catamaran'],
		status: 'publie',
		sourceMd: null,
		createdAt: 1700000000,
		updatedAt: 1700000001,
		...overrides
	}
}

function makeZip(
	questions: QuestionExportRow[],
	templates = TEMPLATES,
	extras: Record<string, Uint8Array> = {}
) {
	const files: Record<string, Uint8Array> = {
		'structure.json': strToU8(JSON.stringify(STRUCTURE)),
		'templates.json': strToU8(JSON.stringify(templates)),
		...extras
	}
	for (const q of questions) {
		files[buildQuestionFilePath(q)] = strToU8(buildQuestionFileContent(q))
	}
	return zipSync(files)
}

// ── Tests structure ───────────────────────────────────────────────────────────

describe('importZip — structure', () => {
	it('crée les supports, catégories et sections', async () => {
		const db = createTestDb()
		await importZip(db, null, makeZip([]), { only: ['structure'] })

		const sups = await db.select().from(supportsTable)
		expect(sups).toHaveLength(2)
		expect(sups.map((s) => s.slug)).toContain('deriveur')
		expect(sups.map((s) => s.slug)).toContain('catamaran')

		const cats = await db.select().from(categoriesTable)
		expect(cats).toHaveLength(1)
		expect(cats[0].slug).toBe('meteo')

		const secs = await db.select().from(sectionsTable)
		expect(secs).toHaveLength(1)
		expect(secs[0].slug).toBe('carte_meteo')
	})

	it('encode enabled=0 pour le support désactivé', async () => {
		const db = createTestDb()
		await importZip(db, null, makeZip([]), { only: ['structure'] })
		const cats = await db.select().from(supportsTable)
		const catamaran = cats.find((s) => s.slug === 'catamaran')
		expect(catamaran?.enabled).toBe(0)
	})

	it('est idempotent : pas de doublons au 2ème import', async () => {
		const db = createTestDb()
		await importZip(db, null, makeZip([]), { only: ['structure'] })
		await importZip(db, null, makeZip([]), { only: ['structure'] })

		const sups = await db.select().from(supportsTable)
		expect(sups).toHaveLength(2)
		const secs = await db.select().from(sectionsTable)
		expect(secs).toHaveLength(1)
	})

	it('met à jour displayName lors d\'un 2ème import', async () => {
		const db = createTestDb()
		await importZip(db, null, makeZip([]), { only: ['structure'] })

		const updatedStructure = {
			...STRUCTURE,
			supports: [{ slug: 'deriveur', displayName: 'Dériveur Mis à jour', enabled: true }],
			categories: []
		}
		const zip = zipSync({
			'structure.json': strToU8(JSON.stringify(updatedStructure)),
			'templates.json': strToU8(JSON.stringify([]))
		})
		await importZip(db, null, zip, { only: ['structure'] })

		const sups = await db.select().from(supportsTable)
		const deriveur = sups.find((s) => s.slug === 'deriveur')
		expect(deriveur?.displayName).toBe('Dériveur Mis à jour')
	})
})

// ── Tests questions ───────────────────────────────────────────────────────────

describe('importZip — questions', () => {
	let db: ReturnType<typeof createTestDb>

	beforeEach(async () => {
		db = createTestDb()
		await importZip(db, null, makeZip([]), { only: ['structure'] })
	})

	it('crée les questions avec les bonnes valeurs', async () => {
		const q = makeQuestion({ difficulty: 'facile', answerSize: 'sm', applicableSupports: ['deriveur'] })
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows).toHaveLength(1)
		expect(rows[0].difficulty).toBe('facile')
		expect(rows[0].answerSize).toBe('sm')
		expect(rows[0].applicableSupports).toBe('["deriveur"]')
		expect(rows[0].status).toBe('publie')
		expect(rows[0].title).toBe('Le vent')
	})

	it('préserve applicableSupports vide', async () => {
		const q = makeQuestion({ applicableSupports: [] })
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows[0].applicableSupports).toBe('[]')
	})

	it('préserve sourceMd non null', async () => {
		const q = makeQuestion({ sourceMd: 'Manuel FFV p.42' })
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows[0].sourceMd).toBe('Manuel FFV p.42')
	})

	it('met sourceMd à null quand absent', async () => {
		const q = makeQuestion({ sourceMd: null })
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows[0].sourceMd).toBeNull()
	})

	it("gère les apostrophes dans le contenu", async () => {
		const q = makeQuestion({
			title: "Qu'est-ce que l'isobare ?",
			questionMd: "Définition de l'isobare.",
			correctionMd: "Ligne d'égale pression."
		})
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows[0].title).toBe("Qu'est-ce que l'isobare ?")
		expect(rows[0].questionMd).toBe("Définition de l'isobare.")
	})

	it('est idempotent : un 2ème import ne duplique pas les questions', async () => {
		const q = makeQuestion()
		await importZip(db, null, makeZip([q]), { only: ['questions'] })
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows).toHaveLength(1)
	})

	it('met à jour une question existante lors du 2ème import', async () => {
		const q = makeQuestion({ title: 'Titre initial' })
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const q2 = makeQuestion({ title: 'Titre mis à jour' })
		await importZip(db, null, makeZip([q2]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows).toHaveLength(1)
		expect(rows[0].title).toBe('Titre mis à jour')
	})

	it('préserve status brouillon', async () => {
		const q = makeQuestion({ status: 'brouillon' })
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows[0].status).toBe('brouillon')
	})

	it('préserve createdAt et updatedAt', async () => {
		const q = makeQuestion({ createdAt: 1700000042, updatedAt: 1700000099 })
		await importZip(db, null, makeZip([q]), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows[0].createdAt).toBe(1700000042)
		expect(rows[0].updatedAt).toBe(1700000099)
	})

	it('importe plusieurs questions indépendamment', async () => {
		const questions = [
			makeQuestion({ id: 10, title: 'Q1', difficulty: 'facile', answerSize: 'xs' }),
			makeQuestion({ id: 11, title: 'Q2', difficulty: 'difficile', answerSize: 'lg' })
		]
		await importZip(db, null, makeZip(questions), { only: ['questions'] })

		const rows = await db.select().from(questionsTable)
		expect(rows).toHaveLength(2)

		const q10 = rows.find((r) => r.id === 10)!
		expect(q10.difficulty).toBe('facile')
		expect(q10.answerSize).toBe('xs')

		const q11 = rows.find((r) => r.id === 11)!
		expect(q11.difficulty).toBe('difficile')
		expect(q11.answerSize).toBe('lg')
	})
})

// ── Tests templates ───────────────────────────────────────────────────────────

describe('importZip — templates', () => {
	let db: ReturnType<typeof createTestDb>

	beforeEach(async () => {
		db = createTestDb()
		await importZip(db, null, makeZip([makeQuestion()]), { only: ['structure'] })
	})

	it('crée les templates et leurs slots', async () => {
		await importZip(db, null, makeZip([]), { only: ['templates'] })

		const templates = await db.select().from(evaluationTemplates)
		expect(templates).toHaveLength(1)
		expect(templates[0].supportSlug).toBe('deriveur')
		expect(templates[0].format).toBe('standard')

		const slots = await db.select().from(templateSlots)
		expect(slots).toHaveLength(1)
		expect(slots[0].position).toBe(1)
		expect(slots[0].questionCount).toBe(3)
	})

	it('est idempotent pour les templates', async () => {
		await importZip(db, null, makeZip([]), { only: ['templates'] })
		await importZip(db, null, makeZip([]), { only: ['templates'] })

		const templates = await db.select().from(evaluationTemplates)
		expect(templates).toHaveLength(1)
		const slots = await db.select().from(templateSlots)
		expect(slots).toHaveLength(1)
	})
})

// ── Tests reports ─────────────────────────────────────────────────────────────

describe('importZip — reports', () => {
	let db: ReturnType<typeof createTestDb>

	const REPORT = {
		id: 1,
		questionId: 42,
		problemType: 'enonce_incorrect',
		description: "Erreur dans l'énoncé",
		email: null,
		status: 'nouveau',
		createdAt: 1700000000
	}

	beforeEach(async () => {
		db = createTestDb()
		await importZip(db, null, makeZip([makeQuestion()]), { only: ['structure', 'questions'] })
	})

	it('crée les signalements avec les bons champs', async () => {
		const zip = makeZip([makeQuestion()], TEMPLATES, {
			'reports.json': strToU8(JSON.stringify([REPORT]))
		})
		await importZip(db, null, zip, { only: ['reports'] })

		const rows = await db.select().from(questionReportsTable)
		expect(rows).toHaveLength(1)
		expect(rows[0].id).toBe(1)
		expect(rows[0].questionId).toBe(42)
		expect(rows[0].problemType).toBe('enonce_incorrect')
		expect(rows[0].status).toBe('nouveau')
		expect(rows[0].createdAt).toBe(1700000000)
	})

	it('est idempotent : un 2ème import ne duplique pas les signalements', async () => {
		const zip = makeZip([makeQuestion()], TEMPLATES, {
			'reports.json': strToU8(JSON.stringify([REPORT]))
		})
		await importZip(db, null, zip, { only: ['reports'] })
		await importZip(db, null, zip, { only: ['reports'] })

		const rows = await db.select().from(questionReportsTable)
		expect(rows).toHaveLength(1)
	})

	it('met à jour un signalement existant lors du 2ème import', async () => {
		const zip1 = makeZip([makeQuestion()], TEMPLATES, {
			'reports.json': strToU8(JSON.stringify([REPORT]))
		})
		await importZip(db, null, zip1, { only: ['reports'] })

		const updated = { ...REPORT, status: 'resolu' }
		const zip2 = makeZip([makeQuestion()], TEMPLATES, {
			'reports.json': strToU8(JSON.stringify([updated]))
		})
		await importZip(db, null, zip2, { only: ['reports'] })

		const rows = await db.select().from(questionReportsTable)
		expect(rows).toHaveLength(1)
		expect(rows[0].status).toBe('resolu')
	})

	it('rétrocompatibilité : ZIP sans reports.json importe 0 signalements', async () => {
		await importZip(db, null, makeZip([makeQuestion()]), { only: ['reports'] })

		const rows = await db.select().from(questionReportsTable)
		expect(rows).toHaveLength(0)
	})
})

// ── Test wipe ─────────────────────────────────────────────────────────────────

describe('importZip — wipe', () => {
	it('vide toutes les tables avant l\'import', async () => {
		const db = createTestDb()
		const q = makeQuestion()
		await importZip(db, null, makeZip([q]))

		let rows = await db.select().from(questionsTable)
		expect(rows).toHaveLength(1)

		await importZip(db, null, makeZip([]), { wipe: true, only: ['structure'] })
		rows = await db.select().from(questionsTable)
		expect(rows).toHaveLength(0)
	})
})

// ── Test résultat retourné ────────────────────────────────────────────────────

describe('importZip — résultat', () => {
	it('retourne les compteurs corrects', async () => {
		const db = createTestDb()
		const questions = [makeQuestion({ id: 1 }), makeQuestion({ id: 2, title: 'Q2' })]
		const result = await importZip(db, null, makeZip(questions))

		expect(result.supports).toBe(2)
		expect(result.categories).toBe(1)
		expect(result.sections).toBe(1)
		expect(result.questions).toBe(2)
		expect(result.templates).toBe(1)
		expect(result.templateSlots).toBe(1)
		expect(result.images).toBe(0)
		expect(result.reports).toBe(0)
	})
})
