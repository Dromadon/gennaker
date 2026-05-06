import { describe, it, expect, beforeAll } from 'vitest'
import { inject } from 'vitest'
import { env as _env } from 'cloudflare:workers'
const env = _env as typeof _env & { DB: D1Database }
// @ts-ignore — cloudflare:test est un module virtuel Miniflare, non résolu par svelte-check
import { applyD1Migrations } from 'cloudflare:test'
import { createSharedEvaluation, getSharedEvaluation } from './shared-evaluations'
import type { SharedEvaluationSlotJson } from './shared-evaluations'

beforeAll(async () => {
	const migrations = inject('migrations')
	await applyD1Migrations(env.DB, migrations)
})

const baseSlots: SharedEvaluationSlotJson[] = [
	{
		slotId: 1,
		sectionId: 10,
		categoryId: 2,
		sectionDisplayName: 'Météo',
		categoryDisplayName: 'Navigation',
		categorySlug: 'navigation',
		sectionSlug: 'meteo',
		questionIds: [42, 17]
	}
]

describe('shared-evaluations queries', () => {
	it('createSharedEvaluation + getSharedEvaluation round-trip', async () => {
		const before = Math.floor(Date.now() / 1000)
		await createSharedEvaluation(env.DB, {
			shortCode: 'abc12x',
			supportSlug: 'deriveur',
			format: 'standard',
			slots: baseSlots
		})

		const row = await getSharedEvaluation(env.DB, 'abc12x')
		expect(row).not.toBeNull()
		expect(row!.shortCode).toBe('abc12x')
		expect(row!.supportSlug).toBe('deriveur')
		expect(row!.format).toBe('standard')
		expect(row!.slots).toEqual(baseSlots)
		expect(row!.expiresAt).toBeGreaterThanOrEqual(before + 30 * 24 * 3600)
	})

	it('getSharedEvaluation retourne null pour un code inconnu', async () => {
		const result = await getSharedEvaluation(env.DB, 'xxxxxx')
		expect(result).toBeNull()
	})

	it('retourne la row même si elle est expirée — vérification expiry laissée au caller', async () => {
		const pastExpiry = Math.floor(Date.now() / 1000) - 1
		// Insertion directe avec expiresAt dans le passé via Drizzle
		const { getDb } = await import('../index')
		const { sharedEvaluations } = await import('../schema')
		await getDb(env.DB).insert(sharedEvaluations).values({
			shortCode: 'expir1',
			supportSlug: 'catamaran',
			format: 'raccourcie',
			slotsJson: JSON.stringify(baseSlots),
			createdAt: pastExpiry - 10,
			expiresAt: pastExpiry
		})

		const row = await getSharedEvaluation(env.DB, 'expir1')
		expect(row).not.toBeNull()
		expect(row!.expiresAt).toBeLessThan(Math.floor(Date.now() / 1000))
	})

	it('contrainte UNIQUE sur short_code lève une erreur', async () => {
		await createSharedEvaluation(env.DB, {
			shortCode: 'uniq99',
			supportSlug: 'windsurf',
			format: 'positionnement',
			slots: baseSlots
		})
		await expect(
			createSharedEvaluation(env.DB, {
				shortCode: 'uniq99',
				supportSlug: 'windsurf',
				format: 'positionnement',
				slots: baseSlots
			})
		).rejects.toThrow()
	})

	it('slot avec questionIds vide (section désactivée) round-trip correct', async () => {
		const slotsWithEmpty: SharedEvaluationSlotJson[] = [
			{ ...baseSlots[0], slotId: 2, questionIds: [] }
		]
		await createSharedEvaluation(env.DB, {
			shortCode: 'empty1',
			supportSlug: 'deriveur',
			format: 'raccourcie',
			slots: slotsWithEmpty
		})
		const row = await getSharedEvaluation(env.DB, 'empty1')
		expect(row!.slots[0].questionIds).toEqual([])
	})
})
