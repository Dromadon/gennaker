import type { Handle } from '@sveltejs/kit'
import { verifySession } from '$lib/server/auth'
import { findAdminById } from '$lib/server/db/queries/admins'
import { createConsoleLogger } from '$lib/server/logger'
import type { AppLogLevel } from '$lib/server/logger'

function resolveLogLevel(raw: string | undefined): AppLogLevel {
	if (raw === 'verbose' || raw === 'debug') return raw
	return 'info'
}

export const handle: Handle = async ({ event, resolve }) => {
	const logLevel = resolveLogLevel(event.platform?.env.LOG_LEVEL)
	const requestId = crypto.randomUUID()
	const logger = createConsoleLogger(logLevel)

	event.locals.requestId = requestId
	event.locals.logger = logger
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
			} else {
				logger.warn('session.invalid', { requestId, reason: 'admin introuvable' })
			}
		} else if (token) {
			logger.warn('session.invalid', { requestId, reason: 'token corrompu ou expiré' })
		}
	}

	const t0 = Date.now()
	let response: Response
	try {
		response = await resolve(event)
	} catch (err) {
		logger.error('request.unhandled_error', err, {
			requestId,
			method: event.request.method,
			path: event.url.pathname,
		})
		throw err
	}

	const status = response.status
	const durationMs = Date.now() - t0

	// TODO debug level: log all requests (method, path, status, durationMs, adminId)

	if (status >= 500) {
		logger.error('request.error_5xx', undefined, {
			requestId,
			method: event.request.method,
			path: event.url.pathname,
			status,
			durationMs,
			adminId: event.locals.adminId,
		})
	} else if (status >= 400 && event.url.pathname.startsWith('/api/')) {
		logger.warn('request.error_4xx', {
			requestId,
			method: event.request.method,
			path: event.url.pathname,
			status,
			durationMs,
		})
	}

	return response
}
