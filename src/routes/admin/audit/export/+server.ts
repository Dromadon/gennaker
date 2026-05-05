import { error, redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getAllAuditLogsForExport } from '$lib/server/db/queries/audit'

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const adminId = url.searchParams.get('adminId') ? Number(url.searchParams.get('adminId')) : undefined
	const targetType = url.searchParams.get('targetType') || undefined
	const fromParam = url.searchParams.get('from')
	const toParam = url.searchParams.get('to')
	const from = fromParam ? Math.floor(new Date(fromParam).getTime() / 1000) : undefined
	const to = toParam ? Math.floor(new Date(toParam + 'T23:59:59').getTime() / 1000) : undefined

	const rows = await getAllAuditLogsForExport(d1, { adminId, targetType, from, to })

	const header = ['date', 'admin', 'action', 'target_type', 'target_id', 'metadata'].join(',')
	const lines = rows.map((r) => [
		new Date(r.createdAt * 1000).toISOString(),
		r.adminName ?? '',
		r.action,
		r.targetType,
		r.targetId ?? '',
		JSON.stringify(r.metadata).replace(/"/g, '""')
	].map((v) => `"${v}"`).join(','))

	const csv = [header, ...lines].join('\n')
	const date = new Date().toISOString().slice(0, 10)

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="audit-${date}.csv"`
		}
	})
}
