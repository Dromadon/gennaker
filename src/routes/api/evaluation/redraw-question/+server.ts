import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { z } from 'zod'
import { pickReplacement } from '$lib/domain/draw'
import { getQuestionMetaBySection, getQuestionsByIds } from '$lib/server/db/queries/questions'

const schema = z.object({
	sectionId: z.number().int().positive(),
	excludeQuestionIds: z.array(z.number().int()),
	support: z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere'])
})

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const body = await request.json()
	const parsed = schema.safeParse(body)
	if (!parsed.success) throw error(400, 'Paramètres invalides')

	const { sectionId, excludeQuestionIds, support } = parsed.data
	const db = platform!.env.DB

	const metaBySection = await getQuestionMetaBySection(db, [sectionId])
	const pool = metaBySection[sectionId] ?? []

	const replacementId = pickReplacement(pool, excludeQuestionIds, support)
	if (replacementId === null) throw error(422, 'Aucune autre question disponible dans cette section')

	const [replacement] = await getQuestionsByIds(db, [replacementId])

	locals.logger.info('evaluation.redraw', { requestId: locals.requestId, sectionId, support, excludedCount: excludeQuestionIds.length, replacementId })

	return json(replacement)
}
