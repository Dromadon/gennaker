import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { countPendingReports } from '$lib/server/db/queries/reports'

export const load: LayoutServerLoad = async ({ locals, url, platform }) => {
	if (!locals.isAdmin && !url.pathname.startsWith('/admin/login')) {
		redirect(302, '/admin/login')
	}

	if (locals.isAdmin && platform?.env.DB) {
		const pendingReportsCount = await countPendingReports(platform.env.DB)
		return { pendingReportsCount }
	}

	return { pendingReportsCount: 0 }
}
