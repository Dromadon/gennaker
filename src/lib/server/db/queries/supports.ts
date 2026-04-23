import { eq } from 'drizzle-orm'
import { getDb } from '../index'
import { supports } from '../schema'
import type { Support } from '$lib/domain/types'

export async function getActiveSupports(d1: D1Database): Promise<Support[]> {
	const rows = await getDb(d1)
		.select({ slug: supports.slug })
		.from(supports)
		.where(eq(supports.enabled, 1))
	return rows.map((r) => r.slug as Support)
}
