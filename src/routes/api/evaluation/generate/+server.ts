import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { z } from 'zod'
import { drawEvaluation } from '$lib/domain/draw'
import { getQuestionMetaBySection, getQuestionsByIds } from '$lib/server/db/queries/questions'
import { getTemplate } from '$lib/server/db/queries/templates'
import type { Evaluation } from '$lib/domain/types'

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
	const metaBySection = await getQuestionMetaBySection(db, sectionIds)

	const drawn = drawEvaluation(template, metaBySection)
	if (!drawn.ok) throw error(422, drawn.error)

	const allIds = drawn.value.slots.flatMap((s) => s.questionIds)
	const questionsById = new Map(
		(await getQuestionsByIds(db, allIds)).map((q) => [q.id, q])
	)

	const evaluation: Evaluation = {
		support: drawn.value.support,
		format: drawn.value.format,
		slots: drawn.value.slots.map((slot) => ({
			slotId: slot.slotId,
			sectionId: slot.sectionId,
			categoryId: slot.categoryId,
			sectionDisplayName: slot.sectionDisplayName,
			categoryDisplayName: slot.categoryDisplayName,
			categorySlug: slot.categorySlug,
			sectionSlug: slot.sectionSlug,
			questions: slot.questionIds.map((id) => questionsById.get(id)!)
		}))
	}

	return json(evaluation)
}
