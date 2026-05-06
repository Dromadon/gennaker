import { error, fail, redirect } from '@sveltejs/kit'
import { z } from 'zod'
import type { Actions, PageServerLoad } from './$types'
import { getAllTemplatesWithSlots, getTemplateSlotById, updateTemplateSlot } from '$lib/server/db/queries/templates'
import { insertAuditLog } from '$lib/server/db/queries/audit'
import { buildSlotAuditMetadata } from '$lib/server/audit'

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.isAdmin) redirect(302, '/admin/login')

	const d1 = platform?.env.DB
	if (!d1) error(500, 'DB unavailable')

	const templates = await getAllTemplatesWithSlots(d1)
	return { templates }
}

export const actions: Actions = {
	setPinned: async ({ request, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform?.env.DB
		if (!d1) error(500, 'DB unavailable')

		const data = await request.formData()
		const slotId = Number(data.get('slotId'))
		const rawQuestionId = data.get('questionId')
		const questionId = rawQuestionId === '' || rawQuestionId === null ? null : Number(rawQuestionId)

		if (!Number.isInteger(slotId) || slotId <= 0) return fail(400, { error: 'slotId invalide' })
		if (questionId !== null && (!Number.isInteger(questionId) || questionId <= 0)) return fail(400, { error: 'questionId invalide' })

		const before = await getTemplateSlotById(d1, slotId)
		if (!before) return fail(400, { error: 'Slot introuvable' })

		try {
			await updateTemplateSlot(d1, slotId, {
				pinnedQuestionId: questionId,
				preferredQuestionIds: before.preferredQuestionIds
			})
		} catch {
			return fail(400, { error: 'Question introuvable ou invalide' })
		}

		await insertAuditLog(d1, {
			adminId: locals.adminId ?? null,
			action: 'template_slot.update',
			targetType: 'template_slot',
			targetId: slotId,
			metadata: buildSlotAuditMetadata(
				{ slotId, templateId: before.templateId, pinnedQuestionId: before.pinnedQuestionId, preferredQuestionIds: before.preferredQuestionIds },
				{ slotId, templateId: before.templateId, pinnedQuestionId: questionId, preferredQuestionIds: before.preferredQuestionIds }
			),
			ipAddress: request.headers.get('cf-connecting-ip')
		})

		return {}
	},

	setPreferred: async ({ request, platform, locals }) => {
		if (!locals.isAdmin) error(403, 'Forbidden')

		const d1 = platform?.env.DB
		if (!d1) error(500, 'DB unavailable')

		const data = await request.formData()
		const slotId = Number(data.get('slotId'))
		const rawIds = data.get('questionIds')

		if (!Number.isInteger(slotId) || slotId <= 0) return fail(400, { error: 'slotId invalide' })

		let parsedIds: number[]
		try {
			const raw = JSON.parse(typeof rawIds === 'string' ? rawIds : '[]')
			const validated = z.array(z.number().int().positive()).safeParse(raw)
			if (!validated.success) return fail(400, { error: 'questionIds invalide' })
			parsedIds = validated.data
		} catch {
			return fail(400, { error: 'questionIds invalide' })
		}

		const before = await getTemplateSlotById(d1, slotId)
		if (!before) return fail(400, { error: 'Slot introuvable' })

		await updateTemplateSlot(d1, slotId, {
			pinnedQuestionId: before.pinnedQuestionId,
			preferredQuestionIds: parsedIds
		})

		await insertAuditLog(d1, {
			adminId: locals.adminId ?? null,
			action: 'template_slot.update',
			targetType: 'template_slot',
			targetId: slotId,
			metadata: buildSlotAuditMetadata(
				{ slotId, templateId: before.templateId, pinnedQuestionId: before.pinnedQuestionId, preferredQuestionIds: before.preferredQuestionIds },
				{ slotId, templateId: before.templateId, pinnedQuestionId: before.pinnedQuestionId, preferredQuestionIds: parsedIds }
			),
			ipAddress: request.headers.get('cf-connecting-ip')
		})

		return {}
	}
}
