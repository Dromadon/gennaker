#!/usr/bin/env tsx
/**
 * Peuple l'environnement local (ou remote) depuis un export ZIP de production.
 *
 * Usage :
 *   tsx scripts/import-export.ts --file <backup.zip> [--local|--remote] [--wipe] [--only=<subset>]
 *
 * --wipe   : vide toutes les tables avant l'import (dev uniquement, activé dans dev:seed)
 * --only   : structure | questions | templates | images  (sans --only : tout)
 * --local  : cible l'app locale sur http://localhost:5173 (défaut)
 * --remote : cible l'app de production (IMPORT_REMOTE_URL dans .env.local)
 *
 * Auth : ADMIN_SESSION_TOKEN dans .env.local (cookie admin_session)
 */

import { readFileSync } from 'fs'
import { existsSync } from 'fs'
import { join } from 'path'

// ── Charger .env.local ────────────────────────────────────────────────────────

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

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)

function getArg(name: string): string | undefined {
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
const only = getArg('--only')

const VALID_ONLY = ['structure', 'questions', 'templates', 'images']
if (only && !VALID_ONLY.includes(only)) {
	console.error(`Erreur : --only doit être l'une de : ${VALID_ONLY.join(', ')}`)
	process.exit(1)
}
if (doWipe && only) {
	console.error('Erreur : --wipe et --only sont incompatibles (wipe vide tout, importer un sous-ensemble ensuite violerait les contraintes FK)')
	process.exit(1)
}

if (doWipe && isRemote) {
	process.stdout.write(
		'\n⚠️  Vous êtes sur le point de vider TOUTES LES TABLES en PRODUCTION.\n' +
		'Tapez "oui" pour confirmer : '
	)
	const answer = await new Promise<string>((resolve) => {
		let buf = ''
		process.stdin.setEncoding('utf-8')
		process.stdin.resume()
		process.stdin.on('data', (chunk: string) => {
			buf += chunk
			if (buf.includes('\n')) {
				process.stdin.pause()
				resolve(buf.trim())
			}
		})
	})
	if (answer !== 'oui') {
		console.log('Annulé.')
		process.exit(0)
	}
}

// ── Config ────────────────────────────────────────────────────────────────────

const sessionToken = getEnv('ADMIN_SESSION_TOKEN')
if (!sessionToken) {
	console.error('Erreur : ADMIN_SESSION_TOKEN manquant dans .env.local ou les variables d\'environnement')
	process.exit(1)
}

const baseUrl = isRemote
	? (getEnv('IMPORT_REMOTE_URL') ?? 'https://gennaker.pages.dev')
	: (getEnv('IMPORT_LOCAL_URL') ?? 'http://localhost:5173')

// ── Main ──────────────────────────────────────────────────────────────────────

console.log(`\nLecture de ${filePath}...`)
const zipBytes = readFileSync(filePath)
console.log(`  ${(zipBytes.length / 1024).toFixed(1)} KB`)

console.log(`\nEnvoi vers ${baseUrl}/admin/import...`)
if (doWipe) console.log('  ⚠ --wipe activé : toutes les tables seront vidées')
if (only) console.log(`  --only=${only}`)

const params = new URLSearchParams()
if (doWipe) params.set('wipe', 'true')
if (only) params.set('only', only)
const importUrl = `${baseUrl}/admin/import?${params}`

let response: Response
try {
	response = await fetch(importUrl, {
		method: 'POST',
		headers: {
			Cookie: `admin_session=${sessionToken}`,
			'Content-Type': 'application/octet-stream'
		},
		body: zipBytes
	})
} catch (err) {
	console.error(`\nErreur réseau : ${err}`)
	console.error(`Vérifiez que l'app tourne sur ${baseUrl}`)
	process.exit(1)
}

if (!response.ok) {
	const text = await response.text().catch(() => '')
	console.error(`\nErreur HTTP ${response.status} : ${text}`)
	process.exit(1)
}

const result = await response.json() as {
	supports: number
	categories: number
	sections: number
	questions: number
	templates: number
	templateSlots: number
	images: number
}

console.log('\nImport terminé :')
console.log(`  ${result.supports} supports, ${result.categories} catégories, ${result.sections} sections`)
console.log(`  ${result.questions} questions`)
console.log(`  ${result.templates} templates, ${result.templateSlots} slots`)
console.log(`  ${result.images} images`)
