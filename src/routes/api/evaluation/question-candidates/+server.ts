import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { z } from 'zod'
import { getQuestionCandidates } from '$lib/server/db/queries/questions'
import type { QuestionPickRow, Support } from '$lib/domain/types'

const schema = z.object({
	sectionId: z.number().int().positive(),
	support: z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere']),
	search: z.string().optional()
})

export const POST: RequestHandler = async ({ request, platform }) => {
	const body = await request.json()
	const parsed = schema.safeParse(body)
	if (!parsed.success) throw error(400, 'Paramètres invalides')

	const { sectionId, support, search } = parsed.data
	const db = platform!.env.DB

	const pool = await getQuestionCandidates(db, sectionId)
	const searchLower = search?.toLowerCase()

	const candidates: QuestionPickRow[] = pool
		.filter(
			(q) =>
				q.applicableSupports.length === 0 ||
				(q.applicableSupports as Support[]).includes(support)
		)
		.filter((q) => !searchLower || q.title.toLowerCase().includes(searchLower))
		.map((q) => ({
			id: q.id,
			title: q.title,
			difficulty: q.difficulty,
			applicableSupports: q.applicableSupports as Support[],
			questionMd: q.questionMd,
			correctionMd: q.correctionMd,
			answerSize: q.answerSize as QuestionPickRow['answerSize']
		}))

	return json(candidates)
}
