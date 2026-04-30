import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { z } from 'zod'
import { drawEvaluation } from '$lib/domain/draw'
import { getQuestionsBySection } from '$lib/server/db/queries/questions'
import { getTemplate } from '$lib/server/db/queries/templates'

const schema = z.object({
	support: z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere']),
	format: z.enum(['standard', 'raccourcie', 'positionnement'])
})

export const GET: RequestHandler = async ({ url, platform }) => {
	const parsed = schema.safeParse({
		support: url.searchParams.get('support'),
		format: url.searchParams.get('format')
	})
	if (!parsed.success) throw error(400, 'Paramètres invalides')

	const db = platform!.env.DB
	const { support, format } = parsed.data

	const template = await getTemplate(db, support, format)
	if (!template) throw error(404, `Aucun template pour ${support} / ${format}`)

	const sectionIds = template.slots.map((s) => s.sectionId)
	const questionsBySection = await getQuestionsBySection(db, sectionIds)

	const result = drawEvaluation(template, questionsBySection)
	if (!result.ok) throw error(422, result.error)

	return json(result.value)
}
