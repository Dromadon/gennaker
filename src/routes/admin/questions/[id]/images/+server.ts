import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { sanitizeFilename } from '$lib/images'

const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo

export const POST: RequestHandler = async ({ request, params, platform, locals }) => {
	if (!locals.isAdmin) error(403, 'Forbidden')

	const r2 = platform?.env.IMAGES
	if (!r2) error(500, 'R2 unavailable')

	const id = Number(params.id)
	if (!id || isNaN(id)) error(400, 'ID invalide')

	const formData = await request.formData()
	const file = formData.get('file')

	if (!(file instanceof File)) error(400, 'Fichier manquant')
	if (!file.type.startsWith('image/')) error(400, 'Le fichier doit être une image')
	if (file.size > MAX_SIZE) error(400, 'Fichier trop volumineux (max 5 Mo)')

	const filename = sanitizeFilename(file.name)
	const key = `${id}/images/${filename}`

	await r2.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } })

	return json({ filename })
}
