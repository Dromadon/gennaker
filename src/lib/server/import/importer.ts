import { eq, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import {
	supports,
	categories,
	sections,
	questions,
	evaluationTemplates,
	templateSlots,
	sharedEvaluations,
	communitySubmissions,
	questionReports
} from '$lib/server/db/schema'
import * as schema from '$lib/server/db/schema'
import { parseZip } from './parse-zip'
import type { StructureJson, ParsedQuestion, ParsedReport } from './parse-zip'
import type { TemplateExportRow } from '$lib/server/db/queries/templates'

export type ImportSubset = 'structure' | 'questions' | 'templates' | 'images' | 'reports'

export type ImportResult = {
	supports: number
	categories: number
	sections: number
	questions: number
	templates: number
	templateSlots: number
	images: number
	reports: number
}

type AnyDb = BaseSQLiteDatabase<any, any, typeof schema>

export function getDbFromD1(d1: D1Database): DrizzleD1Database<typeof schema> {
	return drizzle(d1, { schema })
}

async function wipeAll(db: AnyDb): Promise<void> {
	await db.delete(templateSlots)
	await db.delete(evaluationTemplates)
	await db.delete(sharedEvaluations)
	await db.delete(communitySubmissions)
	await db.delete(questionReports)
	await db.delete(questions)
	await db.delete(sections)
	await db.delete(categories)
	await db.delete(supports)
}

async function importStructure(db: AnyDb, structure: StructureJson): Promise<{ supports: number; categories: number; sections: number }> {
	let supportCount = 0
	let categoryCount = 0
	let sectionCount = 0

	for (const s of structure.supports) {
		await db.insert(supports)
			.values({ slug: s.slug, displayName: s.displayName, enabled: s.enabled ? 1 : 0 })
			.onConflictDoUpdate({
				target: supports.slug,
				set: { displayName: s.displayName, enabled: s.enabled ? 1 : 0 }
			})
		supportCount++
	}

	for (const cat of structure.categories) {
		await db.insert(categories)
			.values({
				slug: cat.slug,
				displayName: cat.displayName,
				applicableSupports: JSON.stringify(cat.applicableSupports)
			})
			.onConflictDoUpdate({
				target: categories.slug,
				set: {
					displayName: cat.displayName,
					applicableSupports: JSON.stringify(cat.applicableSupports)
				}
			})
		categoryCount++

		const catRow = await db.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, cat.slug))
			.get()
		if (!catRow) continue

		for (const sec of cat.sections) {
			await db.insert(sections)
				.values({
					categoryId: catRow.id,
					slug: sec.slug,
					displayName: sec.displayName,
					applicableSupports: JSON.stringify(sec.applicableSupports)
				})
				.onConflictDoUpdate({
					target: [sections.categoryId, sections.slug],
					set: {
						displayName: sec.displayName,
						applicableSupports: JSON.stringify(sec.applicableSupports)
					}
				})
			sectionCount++
		}
	}

	return { supports: supportCount, categories: categoryCount, sections: sectionCount }
}

async function importQuestions(db: AnyDb, parsedQuestions: ParsedQuestion[]): Promise<number> {
	const now = Math.floor(Date.now() / 1000)
	let count = 0

	for (const q of parsedQuestions) {
		const sectionRow = await db.select({ id: sections.id })
			.from(sections)
			.innerJoin(categories, eq(categories.id, sections.categoryId))
			.where(and(eq(sections.slug, q.sectionSlug), eq(categories.slug, q.categorySlug)))
			.get()

		if (!sectionRow) {
			throw new Error(`Section introuvable : ${q.categorySlug}/${q.sectionSlug} (question id=${q.id})`)
		}

		await db.insert(questions)
			.values({
				id: q.id,
				sectionId: sectionRow.id,
				title: q.title,
				questionMd: q.questionMd,
				correctionMd: q.correctionMd,
				difficulty: q.difficulty,
				answerSize: q.answerSize,
				applicableSupports: JSON.stringify(q.applicableSupports),
				status: q.status,
				sourceMd: q.sourceMd ?? null,
				createdAt: q.createdAt ?? now,
				updatedAt: q.updatedAt ?? now
			})
			.onConflictDoUpdate({
				target: questions.id,
				set: {
					sectionId: sectionRow.id,
					title: q.title,
					questionMd: q.questionMd,
					correctionMd: q.correctionMd,
					difficulty: q.difficulty,
					answerSize: q.answerSize,
					applicableSupports: JSON.stringify(q.applicableSupports),
					status: q.status,
					sourceMd: q.sourceMd ?? null,
					updatedAt: q.updatedAt ?? now
				}
			})
		count++
	}

	return count
}

async function importTemplates(db: AnyDb, templates: TemplateExportRow[]): Promise<{ templates: number; templateSlots: number }> {
	const now = Math.floor(Date.now() / 1000)
	let templateCount = 0
	let slotCount = 0

	for (const t of templates) {
		await db.insert(evaluationTemplates)
			.values({
				supportSlug: t.supportSlug,
				format: t.format,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: [evaluationTemplates.supportSlug, evaluationTemplates.format],
				set: { updatedAt: now }
			})
		templateCount++

		const templateRow = await db.select({ id: evaluationTemplates.id })
			.from(evaluationTemplates)
			.where(and(
				eq(evaluationTemplates.supportSlug, t.supportSlug),
				eq(evaluationTemplates.format, t.format)
			))
			.get()
		if (!templateRow) continue

		for (const slot of t.slots) {
			const sectionRow = await db.select({ id: sections.id })
				.from(sections)
				.innerJoin(categories, eq(categories.id, sections.categoryId))
				.where(and(eq(sections.slug, slot.sectionSlug), eq(categories.slug, slot.categorySlug)))
				.get()

			if (!sectionRow) {
				throw new Error(`Section introuvable pour slot : ${slot.categorySlug}/${slot.sectionSlug}`)
			}

			await db.insert(templateSlots)
				.values({
					templateId: templateRow.id,
					sectionId: sectionRow.id,
					position: slot.position,
					questionCount: slot.questionCount,
					pinnedQuestionId: slot.pinnedQuestionId ?? null,
					preferredQuestionIds: slot.preferredQuestionIds ?? '[]'
				})
				.onConflictDoUpdate({
					target: [templateSlots.templateId, templateSlots.position],
					set: {
						sectionId: sectionRow.id,
						questionCount: slot.questionCount,
						pinnedQuestionId: slot.pinnedQuestionId ?? null,
						preferredQuestionIds: slot.preferredQuestionIds ?? '[]'
					}
				})
			slotCount++
		}
	}

	return { templates: templateCount, templateSlots: slotCount }
}

async function importReports(db: AnyDb, reports: ParsedReport[]): Promise<number> {
	for (const r of reports) {
		await db.insert(questionReports)
			.values({
				id: r.id,
				questionId: r.questionId,
				problemType: r.problemType,
				description: r.description ?? null,
				email: r.email ?? null,
				status: r.status,
				createdAt: r.createdAt
			})
			.onConflictDoUpdate({
				target: questionReports.id,
				set: {
					problemType: r.problemType,
					description: r.description ?? null,
					email: r.email ?? null,
					status: r.status
				}
			})
	}
	return reports.length
}

export async function importZip(
	db: AnyDb,
	r2: R2Bucket | null,
	zipBytes: Uint8Array,
	options: { wipe?: boolean; only?: ImportSubset[] } = {}
): Promise<ImportResult> {
	const { structure, templates, questions: parsedQuestions, images, reports: parsedReports } = parseZip(zipBytes)
	const doAll = !options.only || options.only.length === 0
	const only = options.only ?? []

	const result: ImportResult = {
		supports: 0,
		categories: 0,
		sections: 0,
		questions: 0,
		templates: 0,
		templateSlots: 0,
		images: 0,
		reports: 0
	}

	if (options.wipe) {
		await wipeAll(db)
	}

	if (doAll || only.includes('structure')) {
		const counts = await importStructure(db, structure)
		result.supports = counts.supports
		result.categories = counts.categories
		result.sections = counts.sections
	}

	if (doAll || only.includes('questions')) {
		result.questions = await importQuestions(db, parsedQuestions)
	}

	if (doAll || only.includes('reports')) {
		result.reports = await importReports(db, parsedReports)
	}

	if (doAll || only.includes('templates')) {
		const counts = await importTemplates(db, templates)
		result.templates = counts.templates
		result.templateSlots = counts.templateSlots
	}

	if ((doAll || only.includes('images')) && r2) {
		for (const img of images) {
			const key = `${img.questionId}/images/${img.filename}`
			const mime = guessMimeType(img.filename)
			await r2.put(key, img.data, { httpMetadata: { contentType: mime } })
			result.images++
		}
	}

	return result
}

function guessMimeType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase()
	const map: Record<string, string> = {
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		png: 'image/png',
		gif: 'image/gif',
		webp: 'image/webp',
		svg: 'image/svg+xml'
	}
	return map[ext ?? ''] ?? 'application/octet-stream'
}
