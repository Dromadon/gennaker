import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { getAllCategoriesWithSections } from '$lib/server/db/queries/categories'
import { deleteQuestion, getQuestionsAdmin } from '$lib/server/db/queries/questions'

export const load: PageServerLoad = async ({ url, platform, locals }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const categoryId = url.searchParams.get('category') ? Number(url.searchParams.get('category')) : null
	const sectionId = url.searchParams.get('section') ? Number(url.searchParams.get('section')) : null
	const support = url.searchParams.get('support') || null
	const status = url.searchParams.get('status') || null
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'))

	const [{ rows, total }, categories] = await Promise.all([
		getQuestionsAdmin(d1, { categoryId, sectionId, support, status, page }),
		getAllCategoriesWithSections(d1)
	])

	return { rows, total, page, categories, filters: { categoryId, sectionId, support, status } }
}

export const actions: Actions = {
	delete: async ({ request, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform?.env.DB
		if (!d1) error(500, 'DB unavailable')

		const data = await request.formData()
		const id = Number(data.get('id'))
		if (!id || isNaN(id)) return fail(400, { error: 'ID invalide' })

		await deleteQuestion(d1, id)
		return { deleted: true }
	}
}
