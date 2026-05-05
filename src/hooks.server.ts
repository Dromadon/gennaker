import type { Handle } from '@sveltejs/kit'
import { verifySession } from '$lib/server/auth'
import { findAdminById } from '$lib/server/db/queries/admins'

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.isAdmin = false
	event.locals.adminId = null
	event.locals.adminRole = null
	event.locals.mustChangePassword = false

	const token = event.cookies.get('admin_session')
	const secret = event.platform?.env.ADMIN_SESSION_SECRET ?? ''
	const db = event.platform?.env.DB

	if (token && db) {
		const payload = await verifySession(token, secret)
		if (payload) {
			// Lookup DB pour invalider immédiatement les sessions d'admins supprimés
			const admin = await findAdminById(db, payload.adminId)
			if (admin) {
				event.locals.isAdmin = true
				event.locals.adminId = admin.id
				event.locals.adminRole = admin.role
				event.locals.mustChangePassword = admin.mustChangePassword

				const path = event.url.pathname
				if (
					admin.mustChangePassword &&
					path !== '/admin/profile' &&
					path !== '/admin/login'
				) {
					return Response.redirect(new URL('/admin/profile?force=1', event.url), 302)
				}
			}
		}
	}

	return resolve(event)
}
