import { and, asc, count, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { getDb } from '../index'
import { admins, auditLogs } from '../schema'

export type AuditLogRow = {
	id: number
	adminId: number | null
	adminName: string | null
	action: string
	targetType: string
	targetId: number | null
	metadata: Record<string, unknown>
	ipAddress: string | null
	createdAt: number
}

const PAGE_SIZE = 50

export async function insertAuditLog(
	d1: D1Database,
	entry: {
		adminId: number | null
		action: string
		targetType: 'question' | 'submission' | 'report' | 'template_slot'
		targetId: number | null
		metadata: Record<string, unknown>
		ipAddress: string | null
	}
): Promise<void> {
	try {
		await getDb(d1)
			.insert(auditLogs)
			.values({
				adminId: entry.adminId,
				action: entry.action,
				targetType: entry.targetType,
				targetId: entry.targetId,
				metadata: JSON.stringify(entry.metadata),
				ipAddress: entry.ipAddress,
				createdAt: Math.floor(Date.now() / 1000)
			})
	} catch {
		// silencieux — l'audit ne doit jamais bloquer l'action principale
	}
}

export async function getAuditLogs(
	d1: D1Database,
	filters: {
		adminId?: number
		targetType?: string
		from?: number
		to?: number
		page?: number
	}
): Promise<{ rows: AuditLogRow[]; total: number }> {
	const db = getDb(d1)
	const page = filters.page ?? 1
	const offset = (page - 1) * PAGE_SIZE

	const conditions = []
	if (filters.adminId !== undefined) conditions.push(eq(auditLogs.adminId, filters.adminId))
	if (filters.targetType) conditions.push(eq(auditLogs.targetType, filters.targetType))
	if (filters.from !== undefined) conditions.push(gte(auditLogs.createdAt, filters.from))
	if (filters.to !== undefined) conditions.push(lte(auditLogs.createdAt, filters.to))

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const adminName = sql<string | null>`
		CASE WHEN ${admins.id} IS NOT NULL
		THEN ${admins.firstName} || ' ' || ${admins.lastName}
		ELSE NULL END
	`.as('admin_name')

	const [rows, [{ total }]] = await Promise.all([
		db
			.select({
				id: auditLogs.id,
				adminId: auditLogs.adminId,
				adminName,
				action: auditLogs.action,
				targetType: auditLogs.targetType,
				targetId: auditLogs.targetId,
				metadata: auditLogs.metadata,
				ipAddress: auditLogs.ipAddress,
				createdAt: auditLogs.createdAt
			})
			.from(auditLogs)
			.leftJoin(admins, eq(admins.id, auditLogs.adminId))
			.where(where)
			.orderBy(desc(auditLogs.createdAt))
			.limit(PAGE_SIZE)
			.offset(offset),
		db.select({ total: count() }).from(auditLogs).where(where)
	])

	return {
		rows: rows.map((r) => ({
			...r,
			metadata: JSON.parse(r.metadata) as Record<string, unknown>
		})),
		total: total
	}
}

export async function getAllAuditLogsForExport(
	d1: D1Database,
	filters: {
		adminId?: number
		targetType?: string
		from?: number
		to?: number
	}
): Promise<AuditLogRow[]> {
	const db = getDb(d1)

	const conditions = []
	if (filters.adminId !== undefined) conditions.push(eq(auditLogs.adminId, filters.adminId))
	if (filters.targetType) conditions.push(eq(auditLogs.targetType, filters.targetType))
	if (filters.from !== undefined) conditions.push(gte(auditLogs.createdAt, filters.from))
	if (filters.to !== undefined) conditions.push(lte(auditLogs.createdAt, filters.to))

	const where = conditions.length > 0 ? and(...conditions) : undefined

	const adminName = sql<string | null>`
		CASE WHEN ${admins.id} IS NOT NULL
		THEN ${admins.firstName} || ' ' || ${admins.lastName}
		ELSE NULL END
	`.as('admin_name')

	const rows = await db
		.select({
			id: auditLogs.id,
			adminId: auditLogs.adminId,
			adminName,
			action: auditLogs.action,
			targetType: auditLogs.targetType,
			targetId: auditLogs.targetId,
			metadata: auditLogs.metadata,
			ipAddress: auditLogs.ipAddress,
			createdAt: auditLogs.createdAt
		})
		.from(auditLogs)
		.leftJoin(admins, eq(admins.id, auditLogs.adminId))
		.where(where)
		.orderBy(asc(auditLogs.createdAt))
		.limit(10000)

	return rows.map((r) => ({
		...r,
		metadata: JSON.parse(r.metadata) as Record<string, unknown>
	}))
}
