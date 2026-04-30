import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { getAllCategoriesWithSections } from '$lib/server/db/queries/categories'
import { createQuestion } from '$lib/server/db/queries/questions'

const QuestionSchema = z.object({
	title: z.string().min(1).max(500),
	sectionId: z.coerce.number().int().positive(),
	questionMd: z.string().min(1),
	correctionMd: z.string(),
	difficulty: z.enum(['facile', 'moyen', 'difficile']),
	answerSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl']),
	applicableSupports: z
		.array(z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere']))
		.default([]),
	status: z.enum(['brouillon', 'publie']),
	sourceMd: z.string().optional()
})

export const load: PageServerLoad = async ({ platform, locals }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const categories = await getAllCategoriesWithSections(d1)
	return { categories }
}

export const actions: Actions = {
	create: async ({ request, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform?.env.DB
		if (!d1) error(500, 'DB unavailable')

		const data = await request.formData()
		const raw = {
			title: data.get('title'),
			sectionId: data.get('sectionId'),
			questionMd: data.get('questionMd'),
			correctionMd: data.get('correctionMd') ?? '',
			difficulty: data.get('difficulty'),
			answerSize: data.get('answerSize'),
			applicableSupports: data.getAll('applicableSupports'),
			status: data.get('status'),
			sourceMd: data.get('sourceMd') || undefined
		}

		const parsed = QuestionSchema.safeParse(raw)
		if (!parsed.success) {
			return fail(422, { errors: parsed.error.flatten().fieldErrors, values: raw })
		}

		const id = await createQuestion(d1, parsed.data)
		redirect(302, `/admin/questions/${id}/edit?created=1`)
	}
}
