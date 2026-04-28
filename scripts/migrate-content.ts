/**
 * Script one-shot : importe les questions et templates depuis archive/ vers D1.
 * Génère scripts/seed.sql à exécuter via wrangler d1 execute.
 *
 * Usage :
 *   npx tsx scripts/migrate-content.ts --local   (markdown gardé tel quel + images injectées
 *                                                  dans le R2 local via wrangler CLI)
 *   npx tsx scripts/migrate-content.ts --remote  (markdown gardé tel quel, images dans R2 via migrate-image-urls)
 *   npx tsx scripts/migrate-content.ts           (IMAGES_BASE_URL depuis l'environnement, ou chemins relatifs)
 */

import { execSync } from 'child_process'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const ARCHIVE_QUESTIONS = join(ROOT, 'archive/public/questions')
const ARCHIVE_EVALUATIONS = join(ROOT, 'archive/public/evaluations')
const OUTPUT = join(ROOT, 'scripts/seed.sql')

const IS_LOCAL = process.argv[2] === '--local'

// Pour --local : injecte les images dans le R2 local (miniflare via wrangler CLI).
// Les images restent référencées par images/{fn} dans le markdown ; le renderer local
// résout via R2_PUBLIC_URL=/r2-proxy → /r2-proxy/{id}/images/{fn} servi par la route proxy.
// mdPath peut être dans un sous-dossier (ex. secDir/brise_thermique/question.md) — on
// cherche toujours dans dirname(mdPath)/images/, co-localisé avec le fichier markdown.
function uploadImagesToLocalR2(mdPath: string, qId: number) {
	const imagesDir = join(dirname(mdPath), 'images')
	if (!existsSync(imagesDir)) return
	for (const file of readdirSync(imagesDir)) {
		const r2Key = `gennaker-questions/${qId}/images/${file}`
		const filePath = join(imagesDir, file)
		execSync(`npx wrangler r2 object put "${r2Key}" --file "${filePath}" --local`, {
			stdio: 'pipe'
		})
	}
}

// --- SQL helpers ---

function esc(s: string | null | undefined): string {
	if (s === null || s === undefined) return 'NULL'
	return `'${s.replace(/'/g, "''")}'`
}

function stripBom(s: string): string {
	return s.startsWith('﻿') ? s.slice(1) : s
}

const now = Math.floor(Date.now() / 1000)
const lines: string[] = []

function emit(s: string) {
	lines.push(s)
}

// --- Markdown parser ---

type ParsedQuestion = {
	title: string
	questionMd: string
	correctionMd: string
	sourceMd: string | null
}

function parseQuestionMd(raw: string): ParsedQuestion {
	const content = stripBom(raw).trimStart()
	const linesList = content.split('\n')

	// Title: first line starting with '# '
	const titleIdx = linesList.findIndex((l) => l.startsWith('# '))
	if (titleIdx === -1) throw new Error('No title found')
	const title = linesList[titleIdx].replace(/^# /, '').trim()

	// Correction marker
	const correctionIdx = linesList.findIndex(
		(l, i) => i > titleIdx && /^# Correction/i.test(l.trim())
	)
	if (correctionIdx === -1) throw new Error('No correction section found')

	const questionMd = linesList
		.slice(titleIdx + 1, correctionIdx)
		.join('\n')
		.trim()

	const afterCorrection = linesList.slice(correctionIdx + 1).join('\n')

	// Source: <small>...</small> block at the end
	const sourceMatch = afterCorrection.match(/<small>([\s\S]*?)<\/small>/i)
	const sourceMd = sourceMatch ? sourceMatch[1].trim() : null

	const correctionMd = afterCorrection
		.replace(/<small>[\s\S]*?<\/small>/i, '')
		.trim()

	return { title, questionMd, correctionMd, sourceMd }
}

// --- Step 1 : Supports ---

emit('-- Supports')
emit(
	`INSERT OR IGNORE INTO supports (slug, display_name, enabled) VALUES ('deriveur', 'Dériveur', 1);`
)
emit(
	`INSERT OR IGNORE INTO supports (slug, display_name, enabled) VALUES ('catamaran', 'Catamaran', 1);`
)
emit(
	`INSERT OR IGNORE INTO supports (slug, display_name, enabled) VALUES ('windsurf', 'Windsurf', 1);`
)
emit(
	`INSERT OR IGNORE INTO supports (slug, display_name, enabled) VALUES ('croisiere', 'Croisière', 0);`
)
emit('')

// --- Step 2 : Categories & Sections ---

type CategoriesDB = Record<
	string,
	{ displayName: string; sections: Record<string, { displayName: string }> }
>

const categoriesDB: CategoriesDB = JSON.parse(
	stripBom(readFileSync(join(ARCHIVE_QUESTIONS, 'categoriesDB.json'), 'utf-8'))
)

// Track IDs for later reference (sequential, 1-based)
const categoryIds: Record<string, number> = {}
const sectionIds: Record<string, number> = {} // key: "category/section"

let catId = 0
let secId = 0

emit('-- Catégories')
for (const [catSlug, catData] of Object.entries(categoriesDB)) {
	catId++
	categoryIds[catSlug] = catId
	emit(
		`INSERT OR REPLACE INTO categories (id, slug, display_name, applicable_supports) VALUES (${catId}, ${esc(catSlug)}, ${esc(catData.displayName)}, '[]');`
	)
}
emit('')

emit('-- Sections (depuis categoriesDB.json + découverte filesystem)')
for (const [catSlug, catData] of Object.entries(categoriesDB)) {
	const catDirPath = join(ARCHIVE_QUESTIONS, catSlug)
	const knownSections = new Set(Object.keys(catData.sections))

	// Discover sections from filesystem (handles sections missing from categoriesDB)
	let fsSections: string[] = []
	if (existsSync(catDirPath)) {
		fsSections = readdirSync(catDirPath, { withFileTypes: true })
			.filter((e) => e.isDirectory())
			.map((e) => e.name)
	}

	// Union: JSON sections + filesystem sections
	const allSections = [...new Set([...Object.keys(catData.sections), ...fsSections])]

	for (const secSlug of allSections) {
		const displayName =
			catData.sections[secSlug]?.displayName ??
			secSlug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
		secId++
		sectionIds[`${catSlug}/${secSlug}`] = secId
		emit(
			`INSERT OR REPLACE INTO sections (id, category_id, slug, display_name, applicable_supports) VALUES (${secId}, ${categoryIds[catSlug]}, ${esc(secSlug)}, ${esc(displayName)}, '[]');`
		)
	}
}
emit('')

// --- Step 3 : Questions ---

emit('-- Questions')

type DbEntry = {
	fileName: string
	answerSize?: string
	supports?: string[]
}

// Maps "category/section/fileName" -> question id
const questionIds: Record<string, number> = {}
let qId = 0

for (const [catSlug] of Object.entries(categoriesDB)) {
	const catDirPath = join(ARCHIVE_QUESTIONS, catSlug)
	if (!existsSync(catDirPath)) continue

	const sections = readdirSync(catDirPath, { withFileTypes: true })
		.filter((e) => e.isDirectory())
		.map((e) => e.name)

	for (const secSlug of sections) {
		const secDirPath = join(catDirPath, secSlug)
		const dbPath = join(secDirPath, 'db.json')
		if (!existsSync(dbPath)) continue

		const dbEntries: DbEntry[] = JSON.parse(readFileSync(dbPath, 'utf-8'))
		const sectionId = sectionIds[`${catSlug}/${secSlug}`]
		if (!sectionId) {
			console.warn(`Unknown section: ${catSlug}/${secSlug}`)
			continue
		}

		for (const entry of dbEntries) {
			const mdPath = join(secDirPath, entry.fileName)
			if (!existsSync(mdPath)) {
				console.warn(`Missing file: ${mdPath}`)
				continue
			}

			let parsed: ParsedQuestion
			try {
				parsed = parseQuestionMd(readFileSync(mdPath, 'utf-8'))
			} catch (e) {
				// Question sans section Correction : correction vide, publiée quand même
				console.warn(`Sans correction : ${mdPath}`)
				const raw = stripBom(readFileSync(mdPath, 'utf-8')).trimStart()
				const linesList2 = raw.split('\n')
				const titleIdx2 = linesList2.findIndex((l) => l.startsWith('# '))
				const title = titleIdx2 >= 0 ? linesList2[titleIdx2].replace(/^# /, '').trim() : ''
				const questionMd = linesList2.slice(titleIdx2 + 1).join('\n').trim()
				parsed = { title, questionMd, correctionMd: '', sourceMd: null }
			}

			qId++
			const answerSize = entry.answerSize ?? 'md'
			const applicableSupports = entry.supports ? JSON.stringify(entry.supports) : '[]'
			const key = `${catSlug}/${secSlug}/${entry.fileName}`
			questionIds[key] = qId

			if (IS_LOCAL) uploadImagesToLocalR2(mdPath, qId)

			emit(
				`INSERT OR REPLACE INTO questions (id, section_id, title, question_md, correction_md, difficulty, answer_size, applicable_supports, status, source_md, created_at, updated_at) VALUES (${qId}, ${sectionId}, ${esc(parsed.title)}, ${esc(parsed.questionMd)}, ${esc(parsed.correctionMd)}, 'moyen', ${esc(answerSize)}, ${esc(applicableSupports)}, 'publie', ${esc(parsed.sourceMd)}, ${now}, ${now});`
			)
		}
	}
}
emit('')

// --- Step 4 : Evaluation templates ---

emit('-- Templates d\'évaluation')

const SUPPORTS = ['deriveur', 'catamaran', 'windsurf']
const FORMATS = ['standard', 'raccourcie', 'positionnement']

let templateId = 0
let slotId = 0

for (const supportSlug of SUPPORTS) {
	for (const format of FORMATS) {
		const evalPath = join(ARCHIVE_EVALUATIONS, `${supportSlug}_${format}.json`)
		if (!existsSync(evalPath)) continue

		templateId++
		emit(
			`INSERT OR REPLACE INTO evaluation_templates (id, support_slug, format, created_at, updated_at) VALUES (${templateId}, ${esc(supportSlug)}, ${esc(format)}, ${now}, ${now});`
		)

		const evalJson: Record<string, Record<string, { number: number }>> = JSON.parse(
			readFileSync(evalPath, 'utf-8')
		)

		let position = 0
		for (const [catSlug, sections] of Object.entries(evalJson)) {
			for (const [secSlug, slotData] of Object.entries(sections)) {
				const sectionId = sectionIds[`${catSlug}/${secSlug}`]
				if (!sectionId) {
					console.warn(`Template slot references unknown section: ${catSlug}/${secSlug}`)
					continue
				}
				slotId++
				position++
				emit(
					`INSERT OR REPLACE INTO template_slots (id, template_id, section_id, position, question_count, difficulty_filter, preferred_question_ids) VALUES (${slotId}, ${templateId}, ${sectionId}, ${position}, ${slotData.number}, 'any', '[]');`
				)
			}
		}
		position = 0
	}
}
emit('')

// --- Write output ---

writeFileSync(OUTPUT, lines.join('\n') + '\n', 'utf-8')
console.log(`✓ Generated ${OUTPUT}`)
console.log(`  ${catId} catégories, ${secId} sections, ${qId} questions, ${templateId} templates, ${slotId} slots`)
console.log()
console.log('Pour appliquer en local :')
console.log('  npx wrangler d1 execute gennaker --local --file scripts/seed.sql')
console.log()
console.log('Pour appliquer en remote :')
console.log('  npx wrangler d1 execute gennaker --remote --file scripts/seed.sql')
