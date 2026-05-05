import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import {
	approveSubmission,
	getSubmissionById,
	getSubmissionsAdmin,
	rejectSubmission
} from '$lib/server/db/queries/submissions'
import { getQuestionAdminById } from '$lib/server/db/queries/questions'
import { insertAuditLog } from '$lib/server/db/queries/audit'
import { buildQuestionAuditMetadata, buildSubmissionAuditMetadata } from '$lib/server/audit'

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const db = platform!.env.DB
	const page = Number(url.searchParams.get('page') ?? 1)
	const statusFilter = url.searchParams.get('status') || null

	const { rows, total } = await getSubmissionsAdmin(db, { status: statusFilter, page })

	return { rows, total, page, statusFilter }
}

const approveSchema = z.object({
	id: z.coerce.number().int().positive()
})

const rejectSchema = z.object({
	id: z.coerce.number().int().positive(),
	rejectionNote: z.string().max(300).optional()
})

export const actions: Actions = {
	approve: async ({ request, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform!.env.DB
		const data = await request.formData()
		const parsed = approveSchema.safeParse({ id: data.get('id') })
		if (!parsed.success) return fail(422, { errors: parsed.error.flatten().fieldErrors })

		const submission = await getSubmissionById(d1, parsed.data.id)
		if (!submission) return fail(404, { errors: { id: ['Soumission introuvable'] } })

		const newQuestionId = await approveSubmission(d1, submission)
		const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? null

		await insertAuditLog(d1, {
			adminId: locals.adminId,
			action: 'submission.approve',
			targetType: 'submission',
			targetId: submission.id,
			metadata: buildSubmissionAuditMetadata(submission, { newQuestionId }),
			ipAddress: ip
		})

		const createdQuestion = await getQuestionAdminById(d1, newQuestionId)
		await insertAuditLog(d1, {
			adminId: locals.adminId,
			action: 'question.create',
			targetType: 'question',
			targetId: newQuestionId,
			metadata: buildQuestionAuditMetadata(null, createdQuestion),
			ipAddress: ip
		})

		return { approved: true, newQuestionId }
	},

	reject: async ({ request, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform!.env.DB
		const data = await request.formData()
		const parsed = rejectSchema.safeParse({
			id: data.get('id'),
			rejectionNote: data.get('rejectionNote') || undefined
		})
		if (!parsed.success) return fail(422, { errors: parsed.error.flatten().fieldErrors })

		const submission = await getSubmissionById(d1, parsed.data.id)
		if (!submission) return fail(404, { errors: { id: ['Soumission introuvable'] } })

		await rejectSubmission(d1, parsed.data.id, parsed.data.rejectionNote ?? null)

		await insertAuditLog(d1, {
			adminId: locals.adminId,
			action: 'submission.reject',
			targetType: 'submission',
			targetId: parsed.data.id,
			metadata: buildSubmissionAuditMetadata(submission, { rejectionNote: parsed.data.rejectionNote }),
			ipAddress: request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? null
		})

		return { rejected: true }
	}
}
