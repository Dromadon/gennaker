import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getAuditLogs } from '$lib/server/db/queries/audit'
import { listAdmins } from '$lib/server/db/queries/admins'

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const adminId = url.searchParams.get('adminId') ? Number(url.searchParams.get('adminId')) : undefined
	const targetType = url.searchParams.get('targetType') || undefined
	const fromParam = url.searchParams.get('from')
	const toParam = url.searchParams.get('to')
	const from = fromParam ? Math.floor(new Date(fromParam).getTime() / 1000) : undefined
	const to = toParam ? Math.floor(new Date(toParam + 'T23:59:59').getTime() / 1000) : undefined
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))

	const [{ rows, total }, allAdmins] = await Promise.all([
		getAuditLogs(d1, { adminId, targetType, from, to, page }),
		listAdmins(d1)
	])

	return {
		rows,
		total,
		page,
		allAdmins,
		filters: { adminId, targetType, from: fromParam ?? null, to: toParam ?? null }
	}
}
