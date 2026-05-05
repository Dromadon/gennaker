import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { getReportsAdmin, updateReportStatus } from '$lib/server/db/queries/reports'
import { insertAuditLog } from '$lib/server/db/queries/audit'
import { buildReportAuditMetadata } from '$lib/server/audit'

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
	questionId: z.coerce.number().int().positive(),
	status: z.enum(['nouveau', 'resolu'])
})

export const actions: Actions = {
	toggleStatus: async ({ request, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform!.env.DB
		const data = await request.formData()
		const parsed = toggleStatusSchema.safeParse({
			id: data.get('id'),
			questionId: data.get('questionId'),
			status: data.get('status')
		})
		if (!parsed.success) return fail(422, { errors: parsed.error.flatten().fieldErrors })

		await updateReportStatus(d1, parsed.data.id, parsed.data.status)

		const action = parsed.data.status === 'resolu' ? 'report.resolve' : 'report.reopen'
		await insertAuditLog(d1, {
			adminId: locals.adminId,
			action,
			targetType: 'report',
			targetId: parsed.data.id,
			metadata: buildReportAuditMetadata(parsed.data.id, parsed.data.questionId, parsed.data.status),
			ipAddress: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? null
		})

		return { updated: true }
	}
}
