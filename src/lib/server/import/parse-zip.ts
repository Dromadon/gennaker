import { unzipSync, strFromU8 } from 'fflate'
import type { TemplateExportRow } from '$lib/server/db/queries/templates'

export type StructureJson = {
	supports: { slug: string; displayName: string; enabled: boolean }[]
	categories: {
		slug: string
		displayName: string
		applicableSupports: string[]
		sections: {
			slug: string
			displayName: string
			applicableSupports: string[]
		}[]
	}[]
}

export type ParsedQuestion = {
	id: number
	categorySlug: string
	sectionSlug: string
	title: string
	questionMd: string
	correctionMd: string
	sourceMd: string | null
}

export type ParsedImage = {
	questionId: number
	filename: string
	data: Uint8Array
}

export type ParsedZip = {
	structure: StructureJson
	templates: TemplateExportRow[]
	questions: ParsedQuestion[]
	images: ParsedImage[]
}

export function parseQuestionMarkdown(content: string): {
	title: string
	questionMd: string
	correctionMd: string
	sourceMd: string | null
} {
	const lines = content.split('\n')

	// First line is "# Title"
	const title = lines[0].replace(/^#\s+/, '').trim()

	const correctionIdx = lines.findIndex((l) => /^#\s+Correction\s*$/.test(l.trim()))

	let questionMd: string
	let rest: string

	if (correctionIdx === -1) {
		questionMd = lines.slice(1).join('\n').trim()
		rest = ''
	} else {
		questionMd = lines.slice(1, correctionIdx).join('\n').trim()
		rest = lines.slice(correctionIdx + 1).join('\n').trim()
	}

	// Extract optional <small>source</small> at the end of correction
	const sourceMatch = rest.match(/<small>([\s\S]*?)<\/small>\s*$/)
	let correctionMd: string
	let sourceMd: string | null = null

	if (sourceMatch) {
		sourceMd = sourceMatch[1].trim()
		correctionMd = rest.slice(0, sourceMatch.index).trim()
	} else {
		correctionMd = rest
	}

	return { title, questionMd, correctionMd, sourceMd }
}

export function parseZip(zipBytes: Uint8Array): ParsedZip {
	const files = unzipSync(zipBytes)

	if (!files['structure.json']) throw new Error('ZIP invalide : structure.json manquant')
	if (!files['templates.json']) throw new Error('ZIP invalide : templates.json manquant')

	const structure: StructureJson = JSON.parse(strFromU8(files['structure.json']))
	const templates: TemplateExportRow[] = JSON.parse(strFromU8(files['templates.json']))

	if (!structure.supports) throw new Error('ZIP invalide : structure.json ne contient pas de supports')

	const questions: ParsedQuestion[] = []
	const images: ParsedImage[] = []

	for (const [path, data] of Object.entries(files)) {
		if (path === 'structure.json' || path === 'templates.json') continue

		// Expected paths:
		// {cat}/{sec}/{id}/{title}.md
		// {cat}/{sec}/{id}/images/{filename}
		const parts = path.split('/')
		if (parts.length < 4) continue

		const [categorySlug, sectionSlug, idStr, ...rest] = parts
		const questionId = Number(idStr)
		if (isNaN(questionId)) continue

		if (rest.length === 1 && rest[0].endsWith('.md')) {
			const parsed = parseQuestionMarkdown(strFromU8(data))
			questions.push({ id: questionId, categorySlug, sectionSlug, ...parsed })
		} else if (rest.length === 2 && rest[0] === 'images') {
			images.push({ questionId, filename: rest[1], data })
		}
	}

	return { structure, templates, questions, images }
}
