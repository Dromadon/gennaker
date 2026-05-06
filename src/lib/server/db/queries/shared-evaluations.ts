import { eq } from 'drizzle-orm'
import { getDb } from '../index'
import { sharedEvaluations } from '../schema'

export type SharedEvaluationSlotJson = {
	slotId: number
	sectionId: number
	categoryId: number
	sectionDisplayName: string
	categoryDisplayName: string
	categorySlug: string
	sectionSlug: string
	questionIds: number[]
}

export type CreateSharedEvaluationInput = {
	shortCode: string
	supportSlug: string
	format: string
	slots: SharedEvaluationSlotJson[]
}

export type SharedEvaluationRow = {
	shortCode: string
	supportSlug: string
	format: string
	slots: SharedEvaluationSlotJson[]
	expiresAt: number
}

export async function createSharedEvaluation(
	d1: D1Database,
	input: CreateSharedEvaluationInput
): Promise<void> {
	const now = Math.floor(Date.now() / 1000)
	await getDb(d1)
		.insert(sharedEvaluations)
		.values({
			shortCode: input.shortCode,
			supportSlug: input.supportSlug,
			format: input.format,
			slotsJson: JSON.stringify(input.slots),
			createdAt: now,
			expiresAt: now + 30 * 24 * 3600
		})
}

export async function getSharedEvaluation(
	d1: D1Database,
	shortCode: string
): Promise<SharedEvaluationRow | null> {
	const rows = await getDb(d1)
		.select({
			shortCode: sharedEvaluations.shortCode,
			supportSlug: sharedEvaluations.supportSlug,
			format: sharedEvaluations.format,
			slotsJson: sharedEvaluations.slotsJson,
			expiresAt: sharedEvaluations.expiresAt
		})
		.from(sharedEvaluations)
		.where(eq(sharedEvaluations.shortCode, shortCode))
		.limit(1)

	if (rows.length === 0) return null
	const r = rows[0]
	return {
		shortCode: r.shortCode,
		supportSlug: r.supportSlug,
		format: r.format,
		slots: JSON.parse(r.slotsJson) as SharedEvaluationSlotJson[],
		expiresAt: r.expiresAt
	}
}
