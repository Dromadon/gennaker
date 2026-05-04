import { describe, it, expect, beforeAll } from 'vitest'
import { inject } from 'vitest'
import { env as _env } from 'cloudflare:workers'
const env = _env as typeof _env & { DB: D1Database }
// @ts-ignore — cloudflare:test est un module virtuel Miniflare, non résolu par svelte-check
import { applyD1Migrations } from 'cloudflare:test'
import { hash, compare } from 'bcryptjs'
import {
	createAdmin,
	findAdminByEmail,
	findAdminById,
	listAdmins,
	deleteAdmin,
	countSuperAdmins,
	updateAdminPassword,
	updateAdminLastLogin
} from './admins'

beforeAll(async () => {
	const migrations = inject('migrations')
	await applyD1Migrations(env.DB, migrations)
})

describe('admins queries', () => {
	it('createAdmin + findAdminByEmail round-trip', async () => {
		const pwHash = await hash('motdepasse123', 10)
		const id = await createAdmin(env.DB, {
			email: 'alice@example.com',
			firstName: 'Alice',
			lastName: 'Martin',
			passwordHash: pwHash,
			role: 'super_admin',
			mustChangePassword: false
		})
		expect(id).toBeGreaterThan(0)

		const found = await findAdminByEmail(env.DB, 'alice@example.com')
		expect(found).not.toBeNull()
		expect(found!.email).toBe('alice@example.com')
		expect(found!.firstName).toBe('Alice')
		expect(found!.lastName).toBe('Martin')
		expect(found!.role).toBe('super_admin')
		expect(found!.mustChangePassword).toBe(false)
		expect(found!.passwordHash).toBe(pwHash)
	})

	it('findAdminById retourne null pour un id inconnu', async () => {
		const result = await findAdminById(env.DB, 999999)
		expect(result).toBeNull()
	})

	it('contrainte UNIQUE sur email', async () => {
		const pwHash = await hash('motdepasse123', 10)
		await createAdmin(env.DB, {
			email: 'unique@example.com',
			firstName: 'Bob',
			lastName: 'Dupont',
			passwordHash: pwHash,
			role: 'admin',
			mustChangePassword: false
		})
		await expect(
			createAdmin(env.DB, {
				email: 'unique@example.com',
				firstName: 'Charlie',
				lastName: 'Durand',
				passwordHash: pwHash,
				role: 'admin',
				mustChangePassword: false
			})
		).rejects.toThrow()
	})

	it('listAdmins retourne tous les admins insérés', async () => {
		const before = await listAdmins(env.DB)
		const pwHash = await hash('motdepasse123', 10)
		await createAdmin(env.DB, {
			email: 'list-test@example.com',
			firstName: 'Dave',
			lastName: 'Leblanc',
			passwordHash: pwHash,
			role: 'admin',
			mustChangePassword: true
		})
		const after = await listAdmins(env.DB)
		expect(after.length).toBe(before.length + 1)
		expect(after.some((a) => a.email === 'list-test@example.com')).toBe(true)
	})

	it('deleteAdmin supprime la ligne', async () => {
		const pwHash = await hash('motdepasse123', 10)
		const id = await createAdmin(env.DB, {
			email: 'to-delete@example.com',
			firstName: 'Eve',
			lastName: 'Rousseau',
			passwordHash: pwHash,
			role: 'admin',
			mustChangePassword: false
		})
		await deleteAdmin(env.DB, id)
		const found = await findAdminById(env.DB, id)
		expect(found).toBeNull()
	})

	it('countSuperAdmins est correct après create/delete', async () => {
		const before = await countSuperAdmins(env.DB)
		const pwHash = await hash('motdepasse123', 10)
		const id = await createAdmin(env.DB, {
			email: 'superadmin-count@example.com',
			firstName: 'Frank',
			lastName: 'Bernard',
			passwordHash: pwHash,
			role: 'super_admin',
			mustChangePassword: false
		})
		expect(await countSuperAdmins(env.DB)).toBe(before + 1)
		await deleteAdmin(env.DB, id)
		expect(await countSuperAdmins(env.DB)).toBe(before)
	})

	it('updateAdminPassword met à jour hash et mustChangePassword', async () => {
		const pwHash = await hash('motdepasse123', 10)
		const id = await createAdmin(env.DB, {
			email: 'update-pwd@example.com',
			firstName: 'Grace',
			lastName: 'Dupuis',
			passwordHash: pwHash,
			role: 'admin',
			mustChangePassword: false
		})
		const newHash = await hash('nouveaumotdepasse456', 10)
		await updateAdminPassword(env.DB, id, newHash, true)

		const found = await findAdminById(env.DB, id)
		expect(found!.mustChangePassword).toBe(true)
		// Vérifier que le nouveau hash est bien stocké
		const withHash = await findAdminByEmail(env.DB, 'update-pwd@example.com')
		expect(withHash!.passwordHash).toBe(newHash)
	})

	it('updateAdminLastLogin positionne le timestamp', async () => {
		const pwHash = await hash('motdepasse123', 10)
		const id = await createAdmin(env.DB, {
			email: 'last-login@example.com',
			firstName: 'Henri',
			lastName: 'Moreau',
			passwordHash: pwHash,
			role: 'admin',
			mustChangePassword: false
		})
		const before = await findAdminById(env.DB, id)
		expect(before!.lastLoginAt).toBeNull()

		const t = Math.floor(Date.now() / 1000)
		await updateAdminLastLogin(env.DB, id)
		const after = await findAdminById(env.DB, id)
		expect(after!.lastLoginAt).toBeGreaterThanOrEqual(t)
	})

	it('bcryptjs.compare fonctionne sur le hash stocké', async () => {
		const password = 'testmotdepasse!'
		const pwHash = await hash(password, 10)
		await createAdmin(env.DB, {
			email: 'bcrypt-smoke@example.com',
			firstName: 'Isabelle',
			lastName: 'Petit',
			passwordHash: pwHash,
			role: 'admin',
			mustChangePassword: false
		})
		const found = await findAdminByEmail(env.DB, 'bcrypt-smoke@example.com')
		expect(await compare(password, found!.passwordHash)).toBe(true)
		expect(await compare('mauvais-mot-de-passe', found!.passwordHash)).toBe(false)
	})
})
