#!/usr/bin/env tsx
/**
 * Peuple l'environnement local (ou remote) depuis un export ZIP de production.
 *
 * Usage :
 *   tsx scripts/import-export.ts --file <backup.zip> [--local|--remote] [--wipe] [--only=<subset>]
 *
 * --wipe   : vide toutes les tables avant l'import (dev uniquement, activé dans dev:seed)
 * --only   : structure | questions | templates | images  (sans --only : tout)
 * --local  : cible D1 locale + R2 local miniflare (défaut)
 * --remote : cible D1 et R2 Cloudflare production
 */

import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { parseZip } from '../src/lib/server/import/parse-zip.ts'
import { generateStructureSql, generateQuestionsSql, generateTemplatesSql, generateWipeSql } from '../src/lib/server/import/generate-sql.ts'

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
	// Accept both --name=value and --name value
	const eqEntry = args.find((a) => a.startsWith(`${name}=`))
	if (eqEntry) return eqEntry.split('=').slice(1).join('=')
	const idx = args.indexOf(name)
	if (idx !== -1 && idx + 1 < args.length) return args[idx + 1]
	return undefined
}

const filePath = getArg('--file')
if (!filePath) {
	console.error('Erreur : --file=<chemin.zip> est requis')
	process.exit(1)
}

const isRemote = args.includes('--remote')
const doWipe = args.includes('--wipe')
const only = getArg('--only') as 'structure' | 'questions' | 'templates' | 'images' | undefined

const wranglerTarget = isRemote ? '--remote' : '--local'
const r2Target = isRemote ? '' : '--local'

const VALID_ONLY = ['structure', 'questions', 'templates', 'images']
if (only && !VALID_ONLY.includes(only)) {
	console.error(`Erreur : --only doit être l'une de : ${VALID_ONLY.join(', ')}`)
	process.exit(1)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function run(cmd: string) {
	console.log(`  $ ${cmd}`)
	execSync(cmd, { stdio: 'inherit' })
}

function executeSql(sql: string, label: string) {
	if (!sql.trim()) {
		console.log(`  (rien à faire pour ${label})`)
		return
	}
	const tmpFile = join(tmpdir(), `gennaker-import-${randomUUID()}.sql`)
	try {
		writeFileSync(tmpFile, sql, 'utf-8')
		run(`wrangler d1 execute gennaker ${wranglerTarget} --file "${tmpFile}"`)
	} finally {
		try { unlinkSync(tmpFile) } catch {}
	}
}

function uploadImage(questionId: number, filename: string, data: Uint8Array) {
	const tmpFile = join(tmpdir(), `gennaker-img-${randomUUID()}-${filename}`)
	try {
		writeFileSync(tmpFile, data)
		const key = `${questionId}/images/${filename}`
		const localFlag = r2Target ? `--local` : ''
		run(`wrangler r2 object put "gennaker-questions/${key}" --file "${tmpFile}" ${localFlag}`.trim())
	} finally {
		try { unlinkSync(tmpFile) } catch {}
	}
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\nLecture de ${filePath}...`)
const zipBytes = new Uint8Array(readFileSync(filePath))

console.log('Parsing du ZIP...')
const { structure, templates, questions, images } = parseZip(zipBytes)
console.log(`  ${structure.supports.length} supports, ${structure.categories.length} catégories`)
console.log(`  ${questions.length} questions, ${images.length} images`)
console.log(`  ${templates.length} templates`)

const doAll = !only

if (doWipe) {
	console.log('\n[0/4] Nettoyage de la base...')
	executeSql(generateWipeSql(), 'wipe')
}

if (doAll || only === 'structure') {
	console.log('\n[1/4] Structure (supports, catégories, sections)...')
	executeSql(generateStructureSql(structure), 'structure')
}

if (doAll || only === 'questions') {
	console.log('\n[2/4] Questions...')
	executeSql(generateQuestionsSql(questions), 'questions')
}

if (doAll || only === 'templates') {
	console.log('\n[3/4] Templates...')
	executeSql(generateTemplatesSql(templates), 'templates')
}

if (doAll || only === 'images') {
	console.log(`\n[4/4] Images (${images.length})...`)
	for (let i = 0; i < images.length; i++) {
		const img = images[i]
		process.stdout.write(`  (${i + 1}/${images.length}) ${img.questionId}/images/${img.filename}\n`)
		uploadImage(img.questionId, img.filename, img.data)
	}
}

console.log('\nImport terminé.')
