import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.isAdmin && !url.pathname.startsWith('/admin/login')) {
		redirect(302, '/admin/login')
	}
}
