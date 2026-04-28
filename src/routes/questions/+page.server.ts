import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getAllCategoriesWithSections } from '$lib/server/db/queries/categories'
import { getQuestionsPublic } from '$lib/server/db/queries/questions'

export const load: PageServerLoad = async ({ url, platform }) => {
	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const categoryId = url.searchParams.get('category') ? Number(url.searchParams.get('category')) : null
	const sectionId = url.searchParams.get('section') ? Number(url.searchParams.get('section')) : null
	const support = url.searchParams.get('support') || null
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))

	const [{ rows, total }, categories] = await Promise.all([
		getQuestionsPublic(d1, { categoryId, sectionId, support, page }),
		getAllCategoriesWithSections(d1)
	])

	return { rows, total, page, categories, filters: { categoryId, sectionId, support } }
}
