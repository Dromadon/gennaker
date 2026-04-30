import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { z } from 'zod'
import { pickReplacement } from '$lib/domain/draw'
import { getQuestionsBySection } from '$lib/server/db/queries/questions'

const schema = z.object({
	sectionId: z.number().int().positive(),
	excludeQuestionIds: z.array(z.number().int()),
	support: z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere'])
})

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = await request.json()
	const parsed = schema.safeParse(body)
	if (!parsed.success) throw error(400, 'Paramètres invalides')

	const { sectionId, excludeQuestionIds, support } = parsed.data
	const db = platform!.env.DB

	const questionsBySection = await getQuestionsBySection(db, [sectionId])
	const pool = questionsBySection[sectionId] ?? []

	const replacement = pickReplacement(pool, excludeQuestionIds, support)
	if (!replacement) throw error(422, 'Aucune autre question disponible dans cette section')

	return json(replacement)
}
