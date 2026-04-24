import type { Handle } from '@sveltejs/kit'
import { verifySession } from '$lib/server/auth'

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('admin_session')
	const secret = event.platform?.env.ADMIN_SESSION_SECRET ?? ''
	event.locals.isAdmin = token ? await verifySession(token, secret) : false
	return resolve(event)
}
