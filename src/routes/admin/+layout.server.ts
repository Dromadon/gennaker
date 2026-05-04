import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'
import { countPendingReports } from '$lib/server/db/queries/reports'
import { countPendingSubmissions } from '$lib/server/db/queries/submissions'

export const load: LayoutServerLoad = async ({ locals, url, platform }) => {
	if (!locals.isAdmin && !url.pathname.startsWith('/admin/login')) {
		redirect(302, '/admin/login')
	}

	if (locals.isAdmin && platform?.env.DB) {
		const [pendingReportsCount, pendingSubmissionsCount] = await Promise.all([
			countPendingReports(platform.env.DB),
			countPendingSubmissions(platform.env.DB)
		])
		return {
			pendingReportsCount,
			pendingSubmissionsCount,
			adminRole: locals.adminRole
		}
	}

	return { pendingReportsCount: 0, pendingSubmissionsCount: 0, adminRole: null }
}
