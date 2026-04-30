import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { z } from 'zod'
import { createReport } from '$lib/server/db/queries/reports'
import { getQuestionById } from '$lib/server/db/queries/questions'

const BLOCKED_UA = /bot|crawler|spider|headless/i

const schema = z.object({
	problemType: z.enum([
		'enonce_incorrect',
		'correction_incorrecte',
		'question_doublon',
		'mise_en_forme',
		'autre'
	]),
	description: z.string().min(1).max(500),
	email: z.string().email().nullable().optional(),
	honeypot: z.string().optional()
})

export const POST: RequestHandler = async ({ request, params, platform }) => {
	const ua = request.headers.get('user-agent') ?? ''
	if (!ua || BLOCKED_UA.test(ua)) throw error(400, 'Requête invalide')

	const id = Number(params.id)
	if (!id || isNaN(id)) throw error(400, 'ID invalide')

	const body = await request.json()
	const parsed = schema.safeParse(body)
	if (!parsed.success) throw error(400, 'Données invalides')

	if (parsed.data.honeypot) return json({ ok: true })

	const db = platform!.env.DB
	const question = await getQuestionById(db, id)
	if (!question) throw error(404, 'Question introuvable')

	await createReport(db, {
		questionId: id,
		problemType: parsed.data.problemType,
		description: parsed.data.description,
		email: parsed.data.email ?? null
	})

	return json({ ok: true }, { status: 201 })
}
