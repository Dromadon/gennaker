import { error, fail } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { hash } from 'bcryptjs'
import {
	listAdmins,
	createAdmin,
	deleteAdmin,
	countSuperAdmins,
	updateAdminPassword
} from '$lib/server/db/queries/admins'

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.isAdmin) error(403, 'Non autorisé')
	if (locals.adminRole !== 'super_admin') error(403, 'Réservé aux super-administrateurs')
	const db = platform?.env.DB
	if (!db) error(500, 'Erreur serveur')

	const admins = await listAdmins(db)
	return { admins, currentAdminId: locals.adminId }
}

function generateTempPassword(): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
	const bytes = new Uint8Array(16)
	crypto.getRandomValues(bytes)
	return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

const createSchema = z.object({
	email: z.email('Email invalide'),
	firstName: z.string().min(1, 'Prénom requis').max(50),
	lastName: z.string().min(1, 'Nom requis').max(50)
})

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		if (!locals.isAdmin || locals.adminRole !== 'super_admin') return fail(403, { error: 'Non autorisé' })
		const db = platform?.env.DB
		if (!db) return fail(500, { error: 'Erreur serveur' })

		const data = await request.formData()
		const parsed = createSchema.safeParse({
			email: data.get('email'),
			firstName: data.get('firstName'),
			lastName: data.get('lastName')
		})
		if (!parsed.success) {
			const firstError = parsed.error.issues[0]?.message ?? 'Données invalides'
			return fail(422, { createError: firstError })
		}

		const tempPassword = generateTempPassword()
		const passwordHash = await hash(tempPassword, 10)

		try {
			await createAdmin(db, {
				email: parsed.data.email,
				firstName: parsed.data.firstName,
				lastName: parsed.data.lastName,
				passwordHash,
				role: 'admin',
				mustChangePassword: true
			})
		} catch {
			return fail(409, { createError: 'Cet email est déjà utilisé' })
		}

		return { created: true, tempPassword, createdEmail: parsed.data.email }
	},

	delete: async ({ request, locals, platform }) => {
		if (!locals.isAdmin || locals.adminRole !== 'super_admin') return fail(403, { error: 'Non autorisé' })
		const db = platform?.env.DB
		if (!db) return fail(500, { error: 'Erreur serveur' })

		const data = await request.formData()
		const targetId = Number(data.get('targetId'))
		if (!targetId || isNaN(targetId)) return fail(400, { deleteError: 'ID invalide' })

		if (targetId === locals.adminId) return fail(403, { deleteError: 'Vous ne pouvez pas supprimer votre propre compte' })

		const superAdminCount = await countSuperAdmins(db)
		// Vérifier si la cible est un super_admin : on recharge la liste pour voir son rôle
		const { findAdminById } = await import('$lib/server/db/queries/admins')
		const target = await findAdminById(db, targetId)
		if (!target) return fail(404, { deleteError: 'Compte introuvable' })

		if (target.role === 'super_admin' && superAdminCount <= 1) {
			return fail(409, { deleteError: 'Impossible de supprimer le dernier super-administrateur' })
		}

		await deleteAdmin(db, targetId)
		return { deleted: true }
	},

	resetPassword: async ({ request, locals, platform }) => {
		if (!locals.isAdmin || locals.adminRole !== 'super_admin') return fail(403, { error: 'Non autorisé' })
		const db = platform?.env.DB
		if (!db) return fail(500, { error: 'Erreur serveur' })

		const data = await request.formData()
		const targetId = Number(data.get('targetId'))
		if (!targetId || isNaN(targetId)) return fail(400, { resetError: 'ID invalide' })

		const tempPassword = generateTempPassword()
		const passwordHash = await hash(tempPassword, 10)
		await updateAdminPassword(db, targetId, passwordHash, true)

		return { reset: true, tempPassword, resetId: targetId }
	}
}
