import { eq } from 'drizzle-orm'
import { getDb } from '../index'
import { categories, sections } from '../schema'
import type { CategoryWithSections } from '$lib/domain/types'

export async function getAllCategoriesWithSections(d1: D1Database): Promise<CategoryWithSections[]> {
	const rows = await getDb(d1)
		.select({
			catId: categories.id,
			catSlug: categories.slug,
			catDisplayName: categories.displayName,
			secId: sections.id,
			secSlug: sections.slug,
			secDisplayName: sections.displayName
		})
		.from(categories)
		.leftJoin(sections, eq(sections.categoryId, categories.id))
		.orderBy(categories.id, sections.id)

	const map = new Map<number, CategoryWithSections>()
	for (const row of rows) {
		if (!map.has(row.catId)) {
			map.set(row.catId, {
				id: row.catId,
				slug: row.catSlug,
				displayName: row.catDisplayName,
				sections: []
			})
		}
		if (row.secId !== null) {
			map.get(row.catId)!.sections.push({
				id: row.secId,
				slug: row.secSlug!,
				displayName: row.secDisplayName!
			})
		}
	}
	return [...map.values()]
}
