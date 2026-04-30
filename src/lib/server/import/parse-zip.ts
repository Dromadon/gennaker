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
	difficulty: 'facile' | 'moyen' | 'difficile'
	answerSize: 'xs' | 'sm' | 'md' | 'lg'
	applicableSupports: string[]
	status: 'brouillon' | 'publie'
	sourceMd: string | null
	createdAt: number | null
	updatedAt: number | null
}

export type ParsedReport = {
	id: number
	questionId: number
	problemType: string
	description: string | null
	email: string | null
	status: string
	createdAt: number
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
	reports: ParsedReport[]
}

export function parseQuestionMarkdown(content: string): {
	title: string
	questionMd: string
	correctionMd: string
	difficulty: 'facile' | 'moyen' | 'difficile'
	answerSize: 'xs' | 'sm' | 'md' | 'lg'
	applicableSupports: string[]
	status: 'brouillon' | 'publie'
	sourceMd: string | null
	createdAt: number | null
	updatedAt: number | null
} {
	let body = content
	let difficulty: 'facile' | 'moyen' | 'difficile' = 'moyen'
	let answerSize: 'xs' | 'sm' | 'md' | 'lg' = 'md'
	let applicableSupports: string[] = []
	let status: 'brouillon' | 'publie' = 'publie'
	let createdAt: number | null = null
	let updatedAt: number | null = null

	// Parse optional YAML frontmatter (--- ... ---)
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n\n?/)
	if (frontmatterMatch) {
		const fm = frontmatterMatch[1]
		body = content.slice(frontmatterMatch[0].length)

		const diffMatch = fm.match(/^difficulty:\s*(.+)$/m)
		if (diffMatch && ['facile', 'moyen', 'difficile'].includes(diffMatch[1].trim())) {
			difficulty = diffMatch[1].trim() as 'facile' | 'moyen' | 'difficile'
		}
		const sizeMatch = fm.match(/^answerSize:\s*(.+)$/m)
		if (sizeMatch && ['xs', 'sm', 'md', 'lg'].includes(sizeMatch[1].trim())) {
			answerSize = sizeMatch[1].trim() as 'xs' | 'sm' | 'md' | 'lg'
		}
		const supMatch = fm.match(/^applicableSupports:\s*\[([^\]]*)\]$/m)
		if (supMatch) {
			applicableSupports = supMatch[1]
				.split(',')
				.map((s) => s.trim())
				.filter((s) => s.length > 0)
		}
		const statusMatch = fm.match(/^status:\s*(.+)$/m)
		if (statusMatch && ['brouillon', 'publie'].includes(statusMatch[1].trim())) {
			status = statusMatch[1].trim() as 'brouillon' | 'publie'
		}
		const createdAtMatch = fm.match(/^createdAt:\s*(\d+)$/m)
		if (createdAtMatch) createdAt = parseInt(createdAtMatch[1], 10)
		const updatedAtMatch = fm.match(/^updatedAt:\s*(\d+)$/m)
		if (updatedAtMatch) updatedAt = parseInt(updatedAtMatch[1], 10)
	}

	const lines = body.split('\n')

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

	return { title, questionMd, correctionMd, difficulty, answerSize, applicableSupports, status, sourceMd, createdAt, updatedAt }
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
		if (path === 'structure.json' || path === 'templates.json' || path === 'reports.json') continue

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

	const reports: ParsedReport[] = []
	if (files['reports.json']) {
		const raw = JSON.parse(strFromU8(files['reports.json']))
		if (Array.isArray(raw)) reports.push(...raw)
	}

	return { structure, templates, questions, images, reports }
}
