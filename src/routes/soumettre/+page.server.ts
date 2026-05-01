import { error, fail } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { getAllCategoriesWithSections } from '$lib/server/db/queries/categories'
import { createCommunitySubmission } from '$lib/server/db/queries/submissions'

const BLOCKED_UA = /bot|crawler|spider|headless/i

const SubmissionSchema = z.object({
	title: z.string().min(1).max(120),
	sectionId: z.coerce.number().int().positive(),
	questionMd: z.string().min(1),
	correctionMd: z.string().min(1),
	applicableSupports: z
		.array(z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere']))
		.min(1, 'Sélectionnez au moins un support'),
	submitterName: z.string().min(1).max(100),
	submitterEmail: z.string().email(),
	honeypot: z.string().optional()
})

export const load: PageServerLoad = async ({ platform }) => {
	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const categories = await getAllCategoriesWithSections(d1)
	return { categories }
}

export const actions: Actions = {
	submit: async ({ request, platform }) => {
		const ua = request.headers.get('user-agent') ?? ''
		if (!ua || BLOCKED_UA.test(ua)) return { success: true }

		const d1 = platform?.env.DB
		if (!d1) error(500, 'DB unavailable')

		const data = await request.formData()
		const raw = {
			title: data.get('title'),
			sectionId: data.get('sectionId'),
			questionMd: data.get('questionMd'),
			correctionMd: data.get('correctionMd'),
			applicableSupports: data.getAll('applicableSupports'),
			submitterName: data.get('submitterName'),
			submitterEmail: data.get('submitterEmail'),
			honeypot: data.get('honeypot') || undefined
		}

		if (raw.honeypot) return { success: true }

		const parsed = SubmissionSchema.safeParse(raw)
		if (!parsed.success) {
			return fail(422, { errors: parsed.error.flatten().fieldErrors, values: raw })
		}

		await createCommunitySubmission(d1, parsed.data)
		return { success: true }
	}
}
