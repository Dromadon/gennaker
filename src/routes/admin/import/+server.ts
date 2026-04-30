import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { importZip, getDbFromD1 } from '$lib/server/import/importer'
import type { ImportSubset } from '$lib/server/import/importer'

const VALID_SUBSETS: ImportSubset[] = ['structure', 'questions', 'templates', 'images']

export const POST: RequestHandler = async ({ request, url, platform, locals }) => {
	if (!locals.isAdmin) error(403, 'Forbidden')

	const wipe = url.searchParams.get('wipe') === 'true'
	const onlyRaw = url.searchParams.get('only')
	const only = onlyRaw
		? (String(onlyRaw).split(',').filter((s) => VALID_SUBSETS.includes(s as ImportSubset)) as ImportSubset[])
		: []

	if (wipe && only.length > 0) {
		error(400, '--wipe avec --only est invalide : wipe vide toutes les tables, importer un sous-ensemble ensuite violerait les contraintes FK')
	}

	const zipBytes = new Uint8Array(await request.arrayBuffer())
	const db = getDbFromD1(platform!.env.DB)
	const r2 = platform!.env.IMAGES

	let result
	try {
		result = await importZip(db, r2, zipBytes, { wipe, only })
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err)
		console.error('[import] erreur :', message)
		error(500, message)
	}

	return json(result)
}
