/**
 * Script one-shot : migre les clés R2 vers la structure plate
 * Avant : {cat}/{section}/{question_id}/images/{filename}
 * Après  : {question_id}/images/{filename}
 *
 * Usage :
 *   npx tsx scripts/migrate-r2-flat.ts --remote
 *
 * Nécessite : wrangler CLI configuré + accès au bucket remote
 */

import { execSync } from 'child_process'

const R2_BUCKET = 'gennaker-questions'

const flag = process.argv[2]
if (flag !== '--remote') {
	console.log("Ce script s'applique uniquement au bucket R2 remote.")
	console.log('Usage: tsx scripts/migrate-r2-flat.ts --remote')
	process.exit(0)
}

function r2List(cursor?: string): { objects: { key: string }[]; truncated: boolean; cursor?: string } {
	const cursorFlag = cursor ? ` --start-after "${cursor}"` : ''
	const raw = execSync(
		`npx wrangler r2 object list ${R2_BUCKET}${cursorFlag} --remote --json 2>/dev/null`,
		{ encoding: 'utf-8' }
	)
	return JSON.parse(raw)
}

function r2Copy(srcKey: string, dstKey: string, tmpFile: string) {
	execSync(
		`npx wrangler r2 object get "${R2_BUCKET}/${srcKey}" --file "${tmpFile}" --remote 2>/dev/null`,
		{ stdio: 'pipe' }
	)
	execSync(
		`npx wrangler r2 object put "${R2_BUCKET}/${dstKey}" --file "${tmpFile}" --remote 2>/dev/null`,
		{ stdio: 'pipe' }
	)
}

function r2Delete(key: string) {
	execSync(
		`npx wrangler r2 object delete "${R2_BUCKET}/${key}" --remote 2>/dev/null`,
		{ stdio: 'pipe' }
	)
}

import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const tmp = mkdtempSync(join(tmpdir(), 'r2-migrate-'))
const tmpFile = join(tmp, 'img.bin')

let cursor: string | undefined
let total = 0
let migrated = 0
let skipped = 0
let errors = 0

console.log('Listage des objets R2...')

try {
	do {
		const listed = r2List(cursor)
		for (const obj of listed.objects) {
			total++
			const parts = obj.key.split('/')
			// Format actuel attendu : {cat}/{sec}/{id}/images/{fn} → 5 segments
			if (parts.length !== 5 || parts[3] !== 'images') {
				// Peut-être déjà migré ou format inattendu
				if (parts.length === 3 && parts[1] === 'images') {
					console.log(`  déjà plat, ignoré : ${obj.key}`)
					skipped++
				} else {
					console.warn(`  format inattendu, ignoré : ${obj.key}`)
					skipped++
				}
				continue
			}
			const [, , questionId, , filename] = parts
			const newKey = `${questionId}/images/${filename}`

			try {
				r2Copy(obj.key, newKey, tmpFile)
				r2Delete(obj.key)
				console.log(`  ✓ ${obj.key}  →  ${newKey}`)
				migrated++
			} catch (err) {
				console.error(`  ✗ ERREUR pour ${obj.key} :`, err)
				errors++
			}
		}
		cursor = listed.truncated ? listed.cursor : undefined
	} while (cursor)
} finally {
	rmSync(tmp, { recursive: true })
}

console.log(`\nMigration terminée : ${migrated} migré(s), ${skipped} ignoré(s), ${errors} erreur(s) sur ${total} objets.`)
if (errors > 0) process.exit(1)
