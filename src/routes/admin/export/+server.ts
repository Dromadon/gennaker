import { error } from '@sveltejs/kit'
import { zipSync, strToU8 } from 'fflate'
import { getAllQuestionsForExport, getStructureForExport } from '$lib/server/db/queries/questions'
import { getAllTemplatesForExport } from '$lib/server/db/queries/templates'

export const GET = async ({ locals, platform }) => {
	if (!locals.isAdmin) throw error(403, 'Forbidden')

	const db = platform!.env.DB
	const r2 = platform!.env.IMAGES

	const [questionRows, templates, structure] = await Promise.all([
		getAllQuestionsForExport(db),
		getAllTemplatesForExport(db),
		getStructureForExport(db)
	])

	const files: Record<string, Uint8Array> = {}

	const questionMap = new Map(questionRows.map((q) => [q.id, q]))

	// Questions as markdown files — path: {cat}/{section}/{id}/{title}.md
	for (const q of questionRows) {
		const source = q.sourceMd ? `\n\n<small>${q.sourceMd}</small>` : ''
		const content = `# ${q.title}\n\n${q.questionMd}\n\n# Correction\n\n${q.correctionMd}${source}\n`
		const safeName = q.title.replace(/[/\\?%*:|"<>]/g, '-')
		const path = `${q.categorySlug}/${q.sectionSlug}/${q.id}/${safeName}.md`
		files[path] = strToU8(content)
	}

	// Templates JSON
	files['templates.json'] = strToU8(JSON.stringify(templates, null, 2))

	// Structure JSON (categories and sections)
	files['structure.json'] = strToU8(JSON.stringify(structure, null, 2))

	// Images from R2 — keys are flat: "{id}/images/{filename}"
	// ZIP path reconstructs the hierarchy: "{cat}/{section}/{id}/images/{filename}"
	let cursor: string | undefined
	do {
		const listed = await r2.list(cursor ? { cursor } : undefined)
		for (const obj of listed.objects) {
			// Expected key format: "{id}/images/{filename}"
			const parts = obj.key.split('/')
			if (parts.length !== 3 || parts[1] !== 'images') {
				console.error(`Clé R2 inattendue (ignorée) : ${obj.key}`)
				continue
			}
			const [idStr, , filename] = parts
			const q = questionMap.get(Number(idStr))
			if (!q) {
				console.error(`Question inconnue pour clé R2 : ${obj.key}`)
				continue
			}
			const zipKey = `${q.categorySlug}/${q.sectionSlug}/${q.id}/images/${filename}`
			try {
				const r2obj = await r2.get(obj.key)
				if (!r2obj) continue
				files[zipKey] = new Uint8Array(await r2obj.arrayBuffer())
			} catch {
				console.error(`Erreur R2 : ${obj.key}`)
			}
		}
		cursor = listed.truncated ? listed.cursor : undefined
	} while (cursor)

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
