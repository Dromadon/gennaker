import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { verifyPassword, createSession } from '$lib/server/auth'
import { findAdminByEmail, updateAdminLastLogin } from '$lib/server/db/queries/admins'

export const load: PageServerLoad = ({ locals }) => {
	if (locals.isAdmin) redirect(302, '/admin')
}

const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1)
})

export const actions: Actions = {
	default: async ({ request, platform, cookies, locals }) => {
		const data = await request.formData()
		const parsed = loginSchema.safeParse({
			email: data.get('email'),
			password: data.get('password')
		})
		if (!parsed.success) return fail(400, { error: 'Email ou mot de passe invalide' })

		const { email, password } = parsed.data
		const db = platform?.env.DB
		const secret = platform?.env.ADMIN_SESSION_SECRET ?? ''

		if (!db) return fail(500, { error: 'Erreur serveur' })

		const admin = await findAdminByEmail(db, email)
		if (!admin) {
			locals.logger.warn('login.failed', { requestId: locals.requestId, reason: 'admin introuvable' })
			return fail(401, { error: 'Identifiants incorrects' })
		}

		const ok = await verifyPassword(admin.passwordHash, password)
		if (!ok) {
			locals.logger.warn('login.failed', { requestId: locals.requestId, adminId: admin.id, reason: 'mot de passe invalide' })
			return fail(401, { error: 'Identifiants incorrects' })
		}

		const token = await createSession(secret, { adminId: admin.id, role: admin.role })
		cookies.set('admin_session', token, {
			httpOnly: true,
			secure: true,
			sameSite: 'strict',
			path: '/',
			maxAge: 7 * 24 * 60 * 60
		})

		await updateAdminLastLogin(db, admin.id)

		if (admin.mustChangePassword) redirect(302, '/admin/profile?force=1')
		redirect(302, '/admin')
	}
}
