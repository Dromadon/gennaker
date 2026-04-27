/**
 * Script one-shot : migre les images vers la nouvelle structure R2
 * {cat}/{section}/{question_id}/images/{filename} et met à jour le markdown
 * pour utiliser des URLs relatives images/{filename}.
 *
 * Usage :
 *   npx tsx scripts/migrate-image-urls.ts --remote
 *
 * Avant (DB)  : ![alt](https://pub-xxx.r2.dev/meteo/carte_meteo/images/carte.png)
 * Après (DB)  : ![alt](images/carte.png)
 * Avant (R2)  : meteo/carte_meteo/images/carte.png
 * Après (R2)  : meteo/carte_meteo/{question_id}/images/carte.png
 *
 * Source des images : archive/public/questions/{cat}/{section}/images/{filename}
 * Plusieurs questions peuvent référencer la même image → copie dédiée par question.
 *
 * Note : la DB locale utilise /questions-images/... (statique) → pas de migration locale.
 */

import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'

const ROOT = resolve(import.meta.dirname, '..')
const ARCHIVE = join(ROOT, 'archive/public/questions')
const SQL_OUTPUT = join(ROOT, 'scripts/migrate-image-urls.sql')
const R2_BUCKET = 'gennaker-questions'

const flag = process.argv[2]
if (flag !== '--remote') {
	console.log("Ce script s'applique uniquement à la DB remote.")
	console.log('La DB locale utilise /questions-images/... qui passent déjà à travers le renderer.')
	console.log('Usage: tsx scripts/migrate-image-urls.ts --remote')
	process.exit(0)
}

function esc(s: string): string {
	return s.replace(/'/g, "''")
}

// --- 1. Query questions with category + section slugs ---
console.log('Lecture des questions depuis D1 remote...')
const raw = execSync(
	`npx wrangler d1 execute gennaker --remote --json --command "
		SELECT q.id, c.slug AS category_slug, s.slug AS section_slug,
		       q.question_md, q.correction_md
		FROM questions q
		JOIN sections s ON s.id = q.section_id
		JOIN categories c ON c.id = s.category_id
	"`,
	{ cwd: ROOT }
).toString()

type Row = {
	id: number
	category_slug: string
	section_slug: string
	question_md: string
	correction_md: string
}

const parsed = JSON.parse(raw) as Array<{ results: Row[] }>
const rows = parsed[0]?.results ?? []
console.log(`${rows.length} questions lues.`)

// Regex matching absolute R2 URLs: captures any depth path ending in /images/{filename}
// Handles both {cat}/{section}/images/{fn} and {cat}/{section}/{subfolder}/images/{fn}
const ABSOLUTE_URL_RE =
	/https?:\/\/[^/\s)]+\/((?:[a-z0-9_-]+\/)+images\/[^)\s"']+)/g

const sqlLines: string[] = []
let uploadCount = 0
let skipCount = 0

for (const row of rows) {
	const { id, category_slug, section_slug, question_md, correction_md } = row

	// Collect all image references in both fields
	const allMatches: Array<{ oldPath: string; filename: string }> = []
	for (const md of [question_md, correction_md]) {
		for (const match of md.matchAll(ABSOLUTE_URL_RE)) {
			const oldPath = match[1] // e.g. meteo/carte_meteo/images/carte.png
			const filename = oldPath.split('/').pop()!
			if (!allMatches.some((m) => m.filename === filename)) {
				allMatches.push({ oldPath, filename })
			}
		}
	}

	if (allMatches.length === 0) continue

	// Upload each image to new R2 path
	for (const { oldPath, filename } of allMatches) {
		const archivePath = join(ARCHIVE, oldPath)
		const newR2Key = `${category_slug}/${section_slug}/${id}/images/${filename}`

		if (!existsSync(archivePath)) {
			console.warn(`  ⚠ Image absente dans l'archive : ${archivePath}`)
			skipCount++
			continue
		}

		try {
			execSync(
				`npx wrangler r2 object put "${R2_BUCKET}/${newR2Key}" --file "${archivePath}" --remote`,
				{ cwd: ROOT, stdio: 'pipe' }
			)
			uploadCount++
			process.stdout.write(`\r  ${uploadCount} images uploadées...`)
		} catch {
			console.error(`\n  ✗ Échec upload : ${newR2Key}`)
			skipCount++
		}

		// question_images catalog
		sqlLines.push(
			`INSERT OR IGNORE INTO question_images (question_id, filename, storage_url) ` +
				`VALUES (${id}, '${esc(filename)}', '${esc(newR2Key)}');`
		)
	}

	// Update markdown: replace absolute URLs with images/{filename}
	const newQuestion = question_md.replace(
		ABSOLUTE_URL_RE,
		(_m, path: string) => `images/${path.split('/').pop()}`
	)
	const newCorrection = correction_md.replace(
		ABSOLUTE_URL_RE,
		(_m, path: string) => `images/${path.split('/').pop()}`
	)

	if (newQuestion !== question_md || newCorrection !== correction_md) {
		sqlLines.push(
			`UPDATE questions SET question_md = '${esc(newQuestion)}', ` +
				`correction_md = '${esc(newCorrection)}' WHERE id = ${id};`
		)
	}
}

if (uploadCount > 0) console.log()

if (sqlLines.length === 0) {
	console.log('Aucune URL absolue trouvée, rien à migrer.')
	process.exit(0)
}

// --- 2. Execute SQL ---
writeFileSync(SQL_OUTPUT, sqlLines.join('\n') + '\n', 'utf-8')
console.log(`SQL généré : ${SQL_OUTPUT} (${sqlLines.length} requêtes)`)

execSync(`npx wrangler d1 execute gennaker --remote --file scripts/migrate-image-urls.sql`, {
	cwd: ROOT,
	stdio: 'inherit'
})

console.log(`\nMigration terminée. ${uploadCount} images uploadées, ${skipCount} ignorées.`)
