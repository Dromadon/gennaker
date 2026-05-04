import { count, eq } from 'drizzle-orm'
import { getDb } from '../index'
import { admins } from '../schema'

export type AdminRole = 'admin' | 'super_admin'

export type AdminRow = {
	id: number
	email: string
	firstName: string
	lastName: string
	role: AdminRole
	createdAt: number
	updatedAt: number
	lastLoginAt: number | null
	mustChangePassword: boolean
}

type AdminRowWithHash = AdminRow & { passwordHash: string }

function toAdminRow(r: typeof admins.$inferSelect): AdminRow {
	return {
		id: r.id,
		email: r.email,
		firstName: r.firstName,
		lastName: r.lastName,
		role: r.role as AdminRole,
		createdAt: r.createdAt,
		updatedAt: r.updatedAt,
		lastLoginAt: r.lastLoginAt ?? null,
		// SQLite stocke les booléens en 0/1
		mustChangePassword: r.mustChangePassword !== 0
	}
}

export async function findAdminByEmail(
	d1: D1Database,
	email: string
): Promise<AdminRowWithHash | null> {
	const rows = await getDb(d1).select().from(admins).where(eq(admins.email, email)).limit(1)
	if (rows.length === 0) return null
	return { ...toAdminRow(rows[0]), passwordHash: rows[0].passwordHash }
}

export async function findAdminById(d1: D1Database, id: number): Promise<AdminRow | null> {
	const rows = await getDb(d1).select().from(admins).where(eq(admins.id, id)).limit(1)
	if (rows.length === 0) return null
	return toAdminRow(rows[0])
}

export async function listAdmins(d1: D1Database): Promise<AdminRow[]> {
	const rows = await getDb(d1).select().from(admins).orderBy(admins.createdAt)
	return rows.map(toAdminRow)
}

export async function createAdmin(
	d1: D1Database,
	data: {
		email: string
		firstName: string
		lastName: string
		passwordHash: string
		role: AdminRole
		mustChangePassword: boolean
	}
): Promise<number> {
	const now = Math.floor(Date.now() / 1000)
	const result = await getDb(d1)
		.insert(admins)
		.values({
			email: data.email,
			firstName: data.firstName,
			lastName: data.lastName,
			passwordHash: data.passwordHash,
			role: data.role,
			createdAt: now,
			updatedAt: now,
			mustChangePassword: data.mustChangePassword ? 1 : 0
		})
		.returning({ id: admins.id })
	return result[0].id
}

export async function updateAdminPassword(
	d1: D1Database,
	id: number,
	passwordHash: string,
	mustChangePassword: boolean
): Promise<void> {
	await getDb(d1)
		.update(admins)
		.set({
			passwordHash,
			mustChangePassword: mustChangePassword ? 1 : 0,
			updatedAt: Math.floor(Date.now() / 1000)
		})
		.where(eq(admins.id, id))
}

export async function updateAdminLastLogin(d1: D1Database, id: number): Promise<void> {
	const now = Math.floor(Date.now() / 1000)
	await getDb(d1).update(admins).set({ lastLoginAt: now, updatedAt: now }).where(eq(admins.id, id))
}

export async function deleteAdmin(d1: D1Database, id: number): Promise<void> {
	await getDb(d1).delete(admins).where(eq(admins.id, id))
}

export async function countSuperAdmins(d1: D1Database): Promise<number> {
	const result = await getDb(d1)
		.select({ total: count() })
		.from(admins)
		.where(eq(admins.role, 'super_admin'))
	return result[0].total
}
