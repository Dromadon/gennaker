import { describe, it, expect, beforeAll } from 'vitest'
import { inject } from 'vitest'
import { env as _env } from 'cloudflare:workers'
const env = _env as typeof _env & { DB: D1Database }
// @ts-ignore — cloudflare:test est un module virtuel Miniflare, non résolu par svelte-check
import { applyD1Migrations } from 'cloudflare:test'
import { getDb } from '../index'
import { categories, sections, questions, questionReports } from '../schema'
import { getReportById } from './reports'

beforeAll(async () => {
	const migrations = inject('migrations')
	await applyD1Migrations(env.DB, migrations)
})

describe('getReportById', () => {
	it('retourne null pour un id inexistant', async () => {
		const result = await getReportById(env.DB, 999999)
		expect(result).toBeNull()
	})

	it('retourne le bon ReportAdminRow avec les JOINs', async () => {
		const db = getDb(env.DB)
		const now = Math.floor(Date.now() / 1000)

		const [cat] = await db
			.insert(categories)
			.values({ slug: 'cat-report-test', displayName: 'Catégorie Report Test' })
			.returning({ id: categories.id })

		const [sec] = await db
			.insert(sections)
			.values({ categoryId: cat.id, slug: 'sec-report-test', displayName: 'Section Report Test' })
			.returning({ id: sections.id })

		const [q] = await db
			.insert(questions)
			.values({
				sectionId: sec.id,
				title: 'Question pour signalement',
				questionMd: 'Énoncé de test',
				correctionMd: 'Correction de test',
				difficulty: 'moyen',
				answerSize: 'md',
				applicableSupports: '["deriveur"]',
				status: 'publie',
				createdAt: now,
				updatedAt: now
			})
			.returning({ id: questions.id })

		const [report] = await db
			.insert(questionReports)
			.values({
				questionId: q.id,
				problemType: 'enonce_incorrect',
				description: 'La formulation est ambiguë',
				email: 'reporter@example.com',
				status: 'nouveau',
				createdAt: now
			})
			.returning({ id: questionReports.id })

		const result = await getReportById(env.DB, report.id)

		expect(result).not.toBeNull()
		expect(result!.id).toBe(report.id)
		expect(result!.questionId).toBe(q.id)
		expect(result!.questionTitle).toBe('Question pour signalement')
		expect(result!.questionMd).toBe('Énoncé de test')
		expect(result!.correctionMd).toBe('Correction de test')
		expect(result!.categoryDisplayName).toBe('Catégorie Report Test')
		expect(result!.sectionDisplayName).toBe('Section Report Test')
		expect(result!.difficulty).toBe('moyen')
		expect(result!.problemType).toBe('enonce_incorrect')
		expect(result!.description).toBe('La formulation est ambiguë')
		expect(result!.email).toBe('reporter@example.com')
		expect(result!.status).toBe('nouveau')
		expect(result!.createdAt).toBe(now)
	})
})
