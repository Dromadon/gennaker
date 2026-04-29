import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { getReportsAdmin, updateReportStatus } from '$lib/server/db/queries/reports'

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const db = platform!.env.DB
	const page = Number(url.searchParams.get('page') ?? 1)
	const statusFilter = url.searchParams.get('status') || null

	const { rows, total } = await getReportsAdmin(db, { status: statusFilter, page })

	return { rows, total, page, statusFilter }
}

const toggleStatusSchema = z.object({
	id: z.coerce.number().int().positive(),
	status: z.enum(['nouveau', 'resolu'])
})

export const actions: Actions = {
	toggleStatus: async ({ request, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const data = await request.formData()
		const parsed = toggleStatusSchema.safeParse({
			id: data.get('id'),
			status: data.get('status')
		})
		if (!parsed.success) return fail(422, { errors: parsed.error.flatten().fieldErrors })

		await updateReportStatus(platform!.env.DB, parsed.data.id, parsed.data.status)
		return { updated: true }
	}
}
