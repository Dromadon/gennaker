import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { z } from 'zod'
import { customAlphabet } from 'nanoid'
import { createSharedEvaluation } from '$lib/server/db/queries/shared-evaluations'

const generateCode = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	6
)

const QuestionSchema = z.object({
	id: z.number().int().positive(),
	sectionId: z.number().int().positive(),
	title: z.string(),
	questionMd: z.string(),
	correctionMd: z.string(),
	applicableSupports: z.array(z.string()),
	answerSize: z.string()
})

const SlotSchema = z.object({
	slotId: z.number().int().positive(),
	sectionId: z.number().int().positive(),
	categoryId: z.number().int().positive(),
	sectionDisplayName: z.string(),
	categoryDisplayName: z.string(),
	categorySlug: z.string(),
	sectionSlug: z.string(),
	questions: z.array(QuestionSchema)
})

const schema = z.object({
	support: z.enum(['deriveur', 'catamaran', 'windsurf', 'croisiere']),
	format: z.enum(['standard', 'raccourcie', 'positionnement']),
	slots: z.array(SlotSchema)
})

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const body = await request.json()
	const parsed = schema.safeParse(body)
	if (!parsed.success) throw error(400, 'Paramètres invalides')

	const { support, format, slots } = parsed.data
	const db = platform!.env.DB

	const slotsJson = slots.map((slot) => ({
		slotId: slot.slotId,
		sectionId: slot.sectionId,
		categoryId: slot.categoryId,
		sectionDisplayName: slot.sectionDisplayName,
		categoryDisplayName: slot.categoryDisplayName,
		categorySlug: slot.categorySlug,
		sectionSlug: slot.sectionSlug,
		questionIds: slot.questions.map((q) => q.id)
	}))

	let shortCode = generateCode()
	try {
		await createSharedEvaluation(db, { shortCode, supportSlug: support, format, slots: slotsJson })
	} catch {
		// Retry une fois sur collision de contrainte unique
		shortCode = generateCode()
		try {
			await createSharedEvaluation(db, { shortCode, supportSlug: support, format, slots: slotsJson })
		} catch {
			throw error(500, 'Erreur lors de la création du lien de partage')
		}
	}

	locals.logger.info('evaluation.share', { requestId: locals.requestId, support, format, shortCode })

	return json({ url: `/e/${shortCode}` })
}
