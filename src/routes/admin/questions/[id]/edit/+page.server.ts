import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { getAllCategoriesWithSections } from '$lib/server/db/queries/categories'
import {
	deleteQuestion,
	getQuestionAdminById,
	updateQuestion
} from '$lib/server/db/queries/questions'
import { extractImageRefs, deleteOrphanImages, deleteImagesForQuestion } from '$lib/server/r2-images'
import { insertAuditLog } from '$lib/server/db/queries/audit'
import { buildQuestionAuditMetadata } from '$lib/server/audit'

const QuestionSchema = z.object({
	title: z.string().min(1).max(500),
	sectionId: z.coerce.number().int().positive(),
	questionMd: z.string().min(1),
	correctionMd: z.string(),
	difficulty: z.enum(['facile', 'moyen', 'difficile']),
	answerSize: z.enum(['xs', 'sm', 'md', 'lg', 'xl']),
	applicableSupports: z
		.array(z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere']))
		.default([]),
	status: z.enum(['brouillon', 'publie']),
	sourceMd: z.string().optional()
})

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const r2 = platform?.env.IMAGES
	const id = Number(params.id)
	if (!id || isNaN(id)) error(404, 'Question introuvable')

	const [question, categories] = await Promise.all([
		getQuestionAdminById(d1, id),
		getAllCategoriesWithSections(d1)
	])

	if (!question) error(404, 'Question introuvable')

	let existingImages: string[] = []
	if (r2) {
		const listed = await r2.list({ prefix: `${id}/images/` })
		existingImages = listed.objects.map((o) => o.key.split('/').pop()!)
	}

	return { question, categories, existingImages }
}

export const actions: Actions = {
	update: async ({ request, params, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform?.env.DB
		if (!d1) error(500, 'DB unavailable')

		const r2 = platform?.env.IMAGES
		const id = Number(params.id)

		const data = await request.formData()
		const raw = {
			title: data.get('title'),
			sectionId: data.get('sectionId'),
			questionMd: data.get('questionMd'),
			correctionMd: data.get('correctionMd') ?? '',
			difficulty: data.get('difficulty'),
			answerSize: data.get('answerSize'),
			applicableSupports: data.getAll('applicableSupports'),
			status: data.get('status'),
			sourceMd: data.get('sourceMd') || undefined
		}

		const parsed = QuestionSchema.safeParse(raw)
		if (!parsed.success) {
			return fail(422, { errors: parsed.error.flatten().fieldErrors, values: raw })
		}

		const before = await getQuestionAdminById(d1, id)
		await updateQuestion(d1, id, parsed.data)
		const after = await getQuestionAdminById(d1, id)

		await insertAuditLog(d1, {
			adminId: locals.adminId,
			action: 'question.update',
			targetType: 'question',
			targetId: id,
			metadata: buildQuestionAuditMetadata(before, after),
			ipAddress: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? null
		})

		// Supprimer toutes les images R2 non référencées dans le nouveau markdown (orphelines incluses)
		if (r2) {
			const newRefs = new Set([
				...extractImageRefs(parsed.data.questionMd),
				...extractImageRefs(parsed.data.correctionMd)
			])
			const { errors } = await deleteOrphanImages(r2, id, newRefs)
			for (const err of errors) console.error('Erreur suppression R2:', err)
		}

		return { updated: true }
	},

	delete: async ({ params, platform, locals, request }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform?.env.DB
		if (!d1) error(500, 'DB unavailable')

		const r2 = platform?.env.IMAGES
		const id = Number(params.id)

		const before = await getQuestionAdminById(d1, id)

		if (r2) {
			const { errors } = await deleteImagesForQuestion(r2, id)
			if (errors.length > 0) {
				return fail(500, {
					deleteError: `Impossible de supprimer ${errors.length} image(s) R2. Suppression annulée. Erreurs : ${errors.join(', ')}`
				})
			}
		}

		await deleteQuestion(d1, id)

		await insertAuditLog(d1, {
			adminId: locals.adminId,
			action: 'question.delete',
			targetType: 'question',
			targetId: id,
			metadata: buildQuestionAuditMetadata(before, null),
			ipAddress: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? null
		})

		redirect(302, '/admin/questions')
	}
}
