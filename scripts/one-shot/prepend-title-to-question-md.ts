#!/usr/bin/env tsx
/**
 * Migration one-shot : préfixe le titre de chaque question dans questionMd sous forme "# titre\n\n".
 *
 * Avant : title = "Définition d'une dépression", questionMd = "Définissez une dépression…"
 * Après : title = "Définition d'une dépression", questionMd = "# Définition d'une dépression\n\nDéfinissez une dépression…"
 *
 * Usage :
 *   tsx scripts/one-shot/prepend-title-to-question-md.ts [--dry-run] [--local|--remote]
 *
 * --dry-run : affiche les changements sans envoyer le réimport
 * --local   : cible http://localhost:5173 (défaut)
 * --remote  : cible la production (IMPORT_REMOTE_URL dans .env.local)
 *
 * Auth : ADMIN_SESSION_TOKEN dans .env.local
 *
 * Idempotence : une question dont questionMd commence déjà par "# " n'est pas modifiée.
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate'

// ── Env ───────────────────────────────────────────────────────────────────────

function loadEnvLocal(): Record<string, string> {
	const envPath = join(process.cwd(), '.env.local')
	if (!existsSync(envPath)) return {}
	const env: Record<string, string> = {}
	for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const eqIdx = trimmed.indexOf('=')
		if (eqIdx === -1) continue
		env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim()
	}
	return env
}

const envLocal = loadEnvLocal()
function getEnv(key: string): string | undefined {
	return process.env[key] ?? envLocal[key]
}

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const isRemote = args.includes('--remote')

const sessionToken = getEnv('ADMIN_SESSION_TOKEN')
if (!sessionToken) {
	console.error('Erreur : ADMIN_SESSION_TOKEN manquant dans .env.local')
	process.exit(1)
}

const baseUrl = isRemote
	? (getEnv('IMPORT_REMOTE_URL') ?? 'https://gennaker.pages.dev')
	: (getEnv('IMPORT_LOCAL_URL') ?? 'http://localhost:5173')

const headers = { Cookie: `admin_session=${sessionToken}` }

// ── Parsing helpers ───────────────────────────────────────────────────────────

function extractTitleAndQuestionMd(fileContent: string): { title: string; questionMd: string } | null {
	let body = fileContent

	// Strip optional YAML frontmatter
	const fmMatch = fileContent.match(/^---\n[\s\S]*?\n---\n\n?/)
	if (fmMatch) body = fileContent.slice(fmMatch[0].length)

	const lines = body.split('\n')
	if (!lines[0].startsWith('# ')) return null

	const title = lines[0].replace(/^#\s+/, '').trim()

	const correctionIdx = lines.findIndex((l, i) => i > 0 && /^#\s+Correction\s*$/.test(l.trim()))
	const questionMd = (correctionIdx === -1 ? lines.slice(1) : lines.slice(1, correctionIdx))
		.join('\n')
		.trim()

	return { title, questionMd }
}

function rebuildFileContent(original: string, newQuestionMd: string): string {
	let body = original
	let frontmatter = ''

	// Preserve frontmatter
	const fmMatch = original.match(/^---\n[\s\S]*?\n---\n\n?/)
	if (fmMatch) {
		frontmatter = fmMatch[0]
		body = original.slice(fmMatch[0].length)
	}

	const lines = body.split('\n')
	const correctionIdx = lines.findIndex((l, i) => i > 0 && /^#\s+Correction\s*$/.test(l.trim()))

	let correctionAndAfter = ''
	if (correctionIdx !== -1) {
		correctionAndAfter = '\n\n' + lines.slice(correctionIdx).join('\n').trimEnd()
	}

	const titleLine = lines[0]
	return `${frontmatter}${titleLine}\n\n${newQuestionMd}${correctionAndAfter}\n`
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\nCible : ${baseUrl}`)
if (DRY_RUN) console.log('Mode : dry-run (aucune modification ne sera envoyée)')

// 1. Export
console.log('\nTéléchargement de l\'export…')
let exportResp: Response
try {
	exportResp = await fetch(`${baseUrl}/admin/export`, { headers })
} catch (err) {
	console.error(`Erreur réseau : ${err}`)
	process.exit(1)
}
if (!exportResp.ok) {
	console.error(`Erreur HTTP ${exportResp.status} lors de l'export`)
	process.exit(1)
}

const zipBytes = new Uint8Array(await exportResp.arrayBuffer())
console.log(`  ${(zipBytes.length / 1024).toFixed(1)} KB reçus`)

// 2. Unzip et patch
const files = unzipSync(zipBytes)
const patched: Record<string, Uint8Array> = { ...files }

let modifiedCount = 0
let skippedCount = 0

for (const [path, data] of Object.entries(files)) {
	// Questions : {cat}/{sec}/{id}/{title}.md
	const parts = path.split('/')
	if (parts.length !== 4 || !parts[3].endsWith('.md')) continue

	const content = strFromU8(data)
	const parsed = extractTitleAndQuestionMd(content)
	if (!parsed) continue

	const { title, questionMd } = parsed

	if (questionMd.startsWith('# ')) {
		skippedCount++
		continue
	}

	const newQuestionMd = `# ${title}\n\n${questionMd}`

	if (DRY_RUN) {
		console.log(`\n[${parts[2]}] ${title}`)
		console.log(`  questionMd avant : ${questionMd.slice(0, 80).replace(/\n/g, '↵')}${questionMd.length > 80 ? '…' : ''}`)
		console.log(`  questionMd après : # ${title}↵↵${questionMd.slice(0, 60).replace(/\n/g, '↵')}${questionMd.length > 60 ? '…' : ''}`)
	}

	patched[path] = strToU8(rebuildFileContent(content, newQuestionMd))
	modifiedCount++
}

console.log(`\n${modifiedCount} question(s) à modifier, ${skippedCount} déjà conformes (ignorées)`)

if (modifiedCount === 0) {
	console.log('Rien à faire.')
	process.exit(0)
}

if (DRY_RUN) {
	console.log('\n[dry-run] Aucune modification envoyée.')
	process.exit(0)
}

// 3. Confirmation
const { createInterface } = await import('readline')
const rl = createInterface({ input: process.stdin, output: process.stdout })
const confirm = await new Promise<string>((res) =>
	rl.question(`\nModifier ${modifiedCount} question(s) sur ${baseUrl} ? [y/N] `, res)
)
rl.close()

if (confirm !== 'y' && confirm !== 'Y') {
	console.log('Annulé.')
	process.exit(0)
}

// 4. Réimport
console.log('\nEnvoi du réimport…')
const newZip = zipSync(patched)
let importResp: Response
try {
	importResp = await fetch(`${baseUrl}/admin/import?only=questions`, {
		method: 'POST',
		headers: { ...headers, 'Content-Type': 'application/octet-stream' },
		body: newZip.buffer as ArrayBuffer
	})
} catch (err) {
	console.error(`Erreur réseau : ${err}`)
	process.exit(1)
}

if (!importResp.ok) {
	const text = await importResp.text().catch(() => '')
	console.error(`Erreur HTTP ${importResp.status} : ${text}`)
	process.exit(1)
}

const result = await importResp.json() as { questions: number }
console.log(`\nMigration terminée : ${result.questions} question(s) importées.`)
