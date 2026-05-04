import { fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { verifyPassword } from '$lib/server/auth'
import { hash } from 'bcryptjs'
import { findAdminById, updateAdminPassword } from '$lib/server/db/queries/admins'

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.isAdmin || !locals.adminId) redirect(302, '/admin/login')
	const db = platform?.env.DB
	if (!db) redirect(302, '/admin/login')

	const admin = await findAdminById(db, locals.adminId)
	if (!admin) redirect(302, '/admin/login')

	return {
		email: admin.email,
		firstName: admin.firstName,
		lastName: admin.lastName,
		mustChangePassword: admin.mustChangePassword
	}
}

const changePasswordSchema = z
	.object({
		newPassword: z.string().min(8, 'Le nouveau mot de passe doit faire au moins 8 caractères'),
		confirmPassword: z.string()
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: 'Les mots de passe ne correspondent pas',
		path: ['confirmPassword']
	})

export const actions: Actions = {
	changePassword: async ({ request, locals, platform }) => {
		if (!locals.isAdmin || !locals.adminId) return fail(403, { error: 'Non autorisé' })
		const db = platform?.env.DB
		if (!db) return fail(500, { error: 'Erreur serveur' })

		const admin = await findAdminById(db, locals.adminId)
		if (!admin) return fail(404, { error: 'Compte introuvable' })

		const data = await request.formData()
		const parsed = changePasswordSchema.safeParse({
			newPassword: data.get('newPassword'),
			confirmPassword: data.get('confirmPassword')
		})
		if (!parsed.success) {
			const firstError = parsed.error.issues[0]?.message ?? 'Données invalides'
			return fail(422, { error: firstError })
		}

		if (!admin.mustChangePassword) {
			const currentPassword = data.get('currentPassword')
			if (!currentPassword || typeof currentPassword !== 'string') {
				return fail(422, { error: 'Mot de passe actuel requis' })
			}
			// Charger le hash pour vérification — findAdminById ne l'expose pas, on re-query via email
			const { findAdminByEmail } = await import('$lib/server/db/queries/admins')
			const adminWithHash = await findAdminByEmail(db, admin.email)
			if (!adminWithHash) return fail(404, { error: 'Compte introuvable' })

			const ok = await verifyPassword(adminWithHash.passwordHash, currentPassword)
			if (!ok) return fail(401, { error: 'Mot de passe actuel incorrect' })
		}

		const newHash = await hash(parsed.data.newPassword, 10)
		await updateAdminPassword(db, locals.adminId, newHash, false)

		redirect(302, '/admin')
	}
}
