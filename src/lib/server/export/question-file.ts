import type { QuestionExportRow } from '$lib/server/db/queries/questions'

export function buildQuestionFileContent(q: QuestionExportRow): string {
	const supportsYaml =
		q.applicableSupports.length > 0 ? `[${q.applicableSupports.join(', ')}]` : '[]'
	const frontmatter = `---\ndifficulty: ${q.difficulty}\nanswerSize: ${q.answerSize}\napplicableSupports: ${supportsYaml}\n---\n\n`
	const source = q.sourceMd ? `\n\n<small>${q.sourceMd}</small>` : ''
	return `${frontmatter}# ${q.title}\n\n${q.questionMd}\n\n# Correction\n\n${q.correctionMd}${source}\n`
}

export function buildQuestionFilePath(q: QuestionExportRow): string {
	const safeName = q.title.replace(/[/\\?%*:|"<>]/g, '-')
	return `${q.categorySlug}/${q.sectionSlug}/${q.id}/${safeName}.md`
}
