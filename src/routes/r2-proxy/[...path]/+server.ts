import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// Proxy local vers le bucket R2 — utilisé uniquement en dev (vite dev + platformProxy).
// En prod, R2_PUBLIC_URL pointe directement vers le domaine public du bucket.
export const GET: RequestHandler = async ({ params, platform }) => {
	const r2 = platform?.env?.IMAGES
	if (!r2) throw error(500, 'R2 non disponible')

	const obj = await r2.get(params.path)
	if (!obj) throw error(404, 'Image introuvable')

	const headers = new Headers()
	if (obj.httpMetadata?.contentType) headers.set('content-type', obj.httpMetadata.contentType)
	headers.set('etag', obj.httpEtag)

	return new Response(obj.body, { headers })
}
