import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getSubmissionById } from '$lib/server/db/queries/submissions'

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const id = Number(params.id)
	if (!id || isNaN(id)) error(404, 'Soumission introuvable')

	const submission = await getSubmissionById(d1, id)
	if (!submission) error(404, 'Soumission introuvable')

	return { submission }
}
