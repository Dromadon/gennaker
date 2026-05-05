import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getReportById } from '$lib/server/db/queries/reports'

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const id = Number(params.id)
	if (!id || isNaN(id)) error(404, 'Signalement introuvable')

	const report = await getReportById(d1, id)
	if (!report) error(404, 'Signalement introuvable')

	return { report }
}
