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
const CF_ACCOUNT_ID = 'b77debff8b7c573cbf79ef5b1a833aee'

const flag = process.argv[2]
if (flag !== '--remote') {
	console.log("Ce script s'applique uniquement au bucket R2 remote.")
	console.log('Usage: tsx scripts/migrate-r2-flat.ts --remote')
	process.exit(0)
}

function getCfToken(): string {
	// wrangler stores the token; we can retrieve it via `wrangler auth token`
	// Fallback: read from CLOUDFLARE_API_TOKEN env var
	const envToken = process.env.CLOUDFLARE_API_TOKEN
	if (envToken) return envToken
	try {
		const raw = execSync('npx wrangler auth token 2>/dev/null', { encoding: 'utf-8' }).trim()
		// output is "Token: <value>" or just the token
		const match = raw.match(/([a-zA-Z0-9_\-.]{40,})/)
		if (match) return match[1]
	} catch {}
	throw new Error(
		'Impossible de récupérer le token Cloudflare. Définissez CLOUDFLARE_API_TOKEN ou connectez-vous avec `wrangler login`.'
	)
}

async function r2List(cursor?: string): Promise<{ objects: { key: string }[]; truncated: boolean; cursor?: string }> {
	const token = getCfToken()
	const url = new URL(
		`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects`
	)
	if (cursor) url.searchParams.set('cursor', cursor)
	url.searchParams.set('per_page', '1000')

	const resp = await fetch(url.toString(), {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!resp.ok) {
		const text = await resp.text()
		throw new Error(`CF API error ${resp.status}: ${text}`)
	}
	const data = (await resp.json()) as {
		result: { key: string }[]
		result_info: { cursor?: string; is_truncated: boolean }
		success: boolean
		errors: { message: string }[]
	}
	if (!data.success) throw new Error(`CF API: ${data.errors.map((e) => e.message).join(', ')}`)
	return {
		objects: data.result ?? [],
		truncated: data.result_info?.is_truncated ?? false,
		cursor: data.result_info?.cursor,
	}
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
		const listed = await r2List(cursor)
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
