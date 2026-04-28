import { describe, it, expect, vi, beforeEach } from 'vitest'
import { load } from './+page.server'

vi.mock('$lib/server/db/queries/categories', () => ({
	getAllCategoriesWithSections: vi.fn().mockResolvedValue([
		{ id: 1, slug: 'securite', displayName: 'Sécurité', sections: [{ id: 2, slug: 'feux', displayName: 'Feux' }] }
	])
}))

vi.mock('$lib/server/db/queries/questions', () => ({
	getQuestionsPublic: vi.fn().mockResolvedValue({
		rows: [
			{
				id: 1,
				title: 'Q1',
				difficulty: 'moyen',
				status: 'publie',
				answerSize: 'md',
				applicableSupports: [],
				categoryDisplayName: 'Sécurité',
				sectionDisplayName: 'Feux',
				categorySlug: 'securite',
				sectionSlug: 'feux',
				questionMd: 'Enoncé',
				correctionMd: 'Correction',
				sourceMd: null
			}
		],
		total: 1
	})
}))

function makeEvent(url: string = 'http://localhost/questions') {
	return {
		platform: { env: { DB: {} } },
		url: new URL(url)
	} as unknown as Parameters<typeof load>[0]
}

describe('load /questions', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne rows, total, categories, filters sans garde admin', async () => {
		const result = (await load(makeEvent())) as Record<string, unknown>
		expect((result.rows as unknown[]).length).toBe(1)
		expect(result.total).toBe(1)
		expect((result.categories as unknown[]).length).toBe(1)
		expect(result.page).toBe(1)
	})

	it('passe categoryId et sectionId depuis les searchParams', async () => {
		const { getQuestionsPublic } = await import('$lib/server/db/queries/questions')
		await load(makeEvent('http://localhost/questions?category=1&section=2&support=deriveur'))
		expect(getQuestionsPublic).toHaveBeenCalledWith(
			{},
			{ categoryId: 1, sectionId: 2, support: 'deriveur', page: 1 }
		)
	})

	it('ne passe pas de paramètre status à getQuestionsPublic', async () => {
		const { getQuestionsPublic } = await import('$lib/server/db/queries/questions')
		await load(makeEvent('http://localhost/questions?status=brouillon'))
		const callArgs = (getQuestionsPublic as ReturnType<typeof vi.fn>).mock.calls[0][1]
		expect(callArgs).not.toHaveProperty('status')
	})

	it('retourne filters sans status', async () => {
		const result = (await load(makeEvent('http://localhost/questions?category=1'))) as Record<string, unknown>
		const filters = result.filters as Record<string, unknown>
		expect(filters).not.toHaveProperty('status')
		expect(filters.categoryId).toBe(1)
	})
})
