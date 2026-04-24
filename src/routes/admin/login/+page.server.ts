import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { verifyPassword, createSession, sessionCookieHeader } from '$lib/server/auth'

export const load: PageServerLoad = ({ locals }) => {
	if (locals.isAdmin) redirect(302, '/admin')
}

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const data = await request.formData()
		const password = String(data.get('password') ?? '')

		const hash = platform?.env.ADMIN_PASSWORD_HASH ?? ''
		const secret = platform?.env.ADMIN_SESSION_SECRET ?? ''

		const ok = await verifyPassword(hash, password)
		if (!ok) return fail(401, { error: 'Mot de passe incorrect' })

		const token = await createSession(secret)
		cookies.set('admin_session', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60
		})
		redirect(302, '/admin')
	}
}
