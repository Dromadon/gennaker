/**
 * Supprime les clés R2 fantômes de la forme "{id}/images" (fichiers vides créés
 * pour matérialiser un répertoire avant que les vraies images existent).
 *
 * Usage :
 *   npx tsx scripts/one-shot/cleanup-r2-empty-image-dirs.ts [--dry-run]
 */

import { execSync } from 'child_process'

const R2_BUCKET = 'gennaker-questions'
const CF_ACCOUNT_ID = 'b77debff8b7c573cbf79ef5b1a833aee'
const DRY_RUN = process.argv.includes('--dry-run')

function getCfToken(): string {
	const envToken = process.env.CLOUDFLARE_API_TOKEN
	if (envToken) return envToken
	try {
		const raw = execSync('npx wrangler auth token 2>/dev/null', { encoding: 'utf-8' }).trim()
		const match = raw.match(/([a-zA-Z0-9_\-.]{40,})/)
		if (match) return match[1]
	} catch {}
	throw new Error(
		'Token Cloudflare introuvable. Définissez CLOUDFLARE_API_TOKEN ou lancez `wrangler login`.'
	)
}

async function r2List(token: string): Promise<string[]> {
	const keys: string[] = []
	let cursor: string | undefined

	do {
		const url = new URL(
			`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects`
		)
		url.searchParams.set('per_page', '1000')
		if (cursor) url.searchParams.set('cursor', cursor)

		const resp = await fetch(url.toString(), {
			headers: { Authorization: `Bearer ${token}` },
		})
		if (!resp.ok) throw new Error(`CF API ${resp.status}: ${await resp.text()}`)

		const data = (await resp.json()) as {
			success: boolean
			errors: { message: string }[]
			result: { key: string }[]
			result_info: { is_truncated: boolean; cursor?: string }
		}
		if (!data.success) throw new Error(`CF API: ${data.errors.map((e) => e.message).join(', ')}`)

		keys.push(...data.result.map((o) => o.key))
		cursor = data.result_info?.is_truncated ? data.result_info.cursor : undefined
	} while (cursor)

	return keys
}

async function r2Delete(token: string, key: string) {
	const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`
	const resp = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
	if (!resp.ok) throw new Error(`Delete failed for "${key}": ${resp.status} ${await resp.text()}`)
}

async function main() {
	const token = getCfToken()

	console.log(`Listing clés dans ${R2_BUCKET}…`)
	const allKeys = await r2List(token)
	console.log(`${allKeys.length} clés trouvées.`)

	// Cible : exactement "{id}/images/" — clé fantôme avec slash final, sans nom de fichier
	const phantoms = allKeys.filter((k) => /^\d+\/images\/$/.test(k))

	if (phantoms.length === 0) {
		console.log('Aucune clé fantôme à supprimer.')
		return
	}

	console.log(`\nClés fantômes à supprimer (${phantoms.length}) :`)
	for (const k of phantoms) console.log(`  ${k}`)

	if (DRY_RUN) {
		console.log('\n[dry-run] Aucune suppression effectuée.')
		return
	}

	const { createInterface } = await import('readline')
	const rl = createInterface({ input: process.stdin, output: process.stdout })
	const confirm = await new Promise<string>((res) =>
		rl.question(`\nSupprimer ces ${phantoms.length} clés sur prod ? [y/N] `, res)
	)
	rl.close()

	if (confirm !== 'y' && confirm !== 'Y') {
		console.log('Annulé.')
		return
	}

	for (const key of phantoms) {
		process.stdout.write(`Deleting ${key} … `)
		await r2Delete(token, key)
		console.log('OK')
	}
	console.log('Done.')
}

main().catch((e) => {
	console.error(e.message)
	process.exit(1)
})
