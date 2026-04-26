import { error } from '@sveltejs/kit'
import { zipSync, strToU8 } from 'fflate'
import { getAllQuestionsForExport } from '$lib/server/db/queries/questions'
import { getAllTemplatesForExport } from '$lib/server/db/queries/templates'

export const GET = async ({ locals, platform }) => {
	if (!locals.isAdmin) throw error(403, 'Forbidden')

	const db = platform!.env.DB
	const r2 = platform!.env.IMAGES

	const [questionRows, templates] = await Promise.all([
		getAllQuestionsForExport(db),
		getAllTemplatesForExport(db)
	])

	const files: Record<string, Uint8Array> = {}

	const questionMap = new Map(questionRows.map((q) => [q.id, q]))

	// Questions as markdown files — path: {cat}/{section}/{id}/{title}.md
	for (const q of questionRows) {
		const content = `# ${q.title}\n\n${q.questionMd}\n\n# Correction\n\n${q.correctionMd}\n`
		const safeName = q.title.replace(/[/\\?%*:|"<>]/g, '-')
		const path = `${q.categorySlug}/${q.sectionSlug}/${q.id}/${safeName}.md`
		files[path] = strToU8(content)
	}

	// Templates JSON
	files['templates.json'] = strToU8(JSON.stringify(templates, null, 2))

	// Images from R2 — keys follow {cat}/{section}/{id}/images/{filename}
	// ZIP path = R2 key directly (co-located with markdown)
	const listed = await r2.list()
	for (const obj of listed.objects) {
		try {
			const r2obj = await r2.get(obj.key)
			if (!r2obj) continue
			files[obj.key] = new Uint8Array(await r2obj.arrayBuffer())
		} catch {
			console.error(`Erreur R2 : ${obj.key}`)
		}
	}

	const date = new Date().toISOString().slice(0, 10)
	const filename = `gennaker-backup-${date}.zip`
	const zipped = zipSync(files)

	return new Response(zipped.buffer as ArrayBuffer, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	})
}
