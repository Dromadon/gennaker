import { error } from '@sveltejs/kit'
import { zipSync, strToU8 } from 'fflate'
import { getAllQuestionsForExport, getAllImagesForExport } from '$lib/server/db/queries/questions'
import { getAllTemplatesForExport } from '$lib/server/db/queries/templates'

export const GET = async ({ locals, platform }) => {
	if (!locals.isAdmin) throw error(403, 'Forbidden')

	const db = platform!.env.DB
	const r2 = platform!.env.IMAGES

	const [questionRows, imageRows, templates] = await Promise.all([
		getAllQuestionsForExport(db),
		getAllImagesForExport(db),
		getAllTemplatesForExport(db)
	])

	const files: Record<string, Uint8Array> = {}

	// Questions as markdown files
	for (const q of questionRows) {
		const content = `# ${q.title}\n\n${q.questionMd}\n\n# Correction\n\n${q.correctionMd}\n`
		const safeName = q.title.replace(/[/\\?%*:|"<>]/g, '-')
		const path = `questions/${q.categorySlug}/${q.sectionSlug}/${safeName}.md`
		files[path] = strToU8(content)
	}

	// Templates JSON
	files['templates.json'] = strToU8(JSON.stringify(templates, null, 2))

	// Images from R2
	for (const img of imageRows) {
		const r2Key = `questions/${img.questionId}/${img.filename}`
		try {
			const obj = await r2.get(r2Key)
			if (!obj) continue
			const buf = await obj.arrayBuffer()
			const zipPath = `images/${img.categorySlug}/${img.sectionSlug}/images/${img.filename}`
			files[zipPath] = new Uint8Array(buf)
		} catch {
			console.error(`Image absente dans R2 : ${r2Key}`)
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
