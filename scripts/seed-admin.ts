#!/usr/bin/env tsx
/**
 * Crée le premier super_admin en base D1.
 *
 * Usage :
 *   tsx scripts/seed-admin.ts --email <email> --first-name <prénom> --last-name <nom> --password <mot_de_passe> [--local|--remote]
 *
 * Ne peut pas être exécuté si un super_admin existe déjà.
 * Le mot de passe doit faire au moins 8 caractères.
 */

import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { hash } from 'bcryptjs'

function parseArgs(): {
	email: string
	firstName: string
	lastName: string
	password: string
	remote: boolean
} {
	const args = process.argv.slice(2)
	const get = (flag: string): string | undefined => {
		const idx = args.indexOf(flag)
		return idx !== -1 ? args[idx + 1] : undefined
	}
	const email = get('--email')
	const firstName = get('--first-name')
	const lastName = get('--last-name')
	const password = get('--password')
	const remote = args.includes('--remote')

	if (!email || !firstName || !lastName || !password) {
		console.error('Usage: tsx scripts/seed-admin.ts --email <email> --first-name <prénom> --last-name <nom> --password <mot_de_passe> [--local|--remote]')
		process.exit(1)
	}

	return { email, firstName, lastName, password, remote }
}

function wrangler(cmd: string, remote: boolean): string {
	const flag = remote ? '--remote' : '--local'
	return execSync(`npx wrangler d1 execute gennaker ${flag} ${cmd} 2>&1`, { encoding: 'utf8' })
}

function wranglerFile(sql: string, remote: boolean): void {
	const flag = remote ? '--remote' : '--local'
	const tmpFile = join(tmpdir(), `seed-admin-${Date.now()}.sql`)
	writeFileSync(tmpFile, sql, 'utf8')
	try {
		execSync(`npx wrangler d1 execute gennaker ${flag} --file "${tmpFile}" 2>&1`, { encoding: 'utf8' })
	} finally {
		unlinkSync(tmpFile)
	}
}

async function main() {
	const { email, firstName, lastName, password, remote } = parseArgs()

	if (password.length < 8) {
		console.error('Erreur : le mot de passe doit faire au moins 8 caractères.')
		process.exit(1)
	}
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailRegex.test(email)) {
		console.error('Erreur : email invalide.')
		process.exit(1)
	}

	console.log(`Vérification en base ${remote ? 'remote' : 'locale'}…`)
	const checkResult = wrangler(`--command "SELECT COUNT(*) as n FROM admins WHERE role='super_admin';" --json`, remote)
	let checkJson: unknown
	try {
		checkJson = JSON.parse(checkResult)
	} catch {
		console.error('Erreur : réponse inattendue de wrangler :\n' + checkResult)
		process.exit(1)
	}
	const count = (checkJson as any)[0]?.results?.[0]?.n ?? null
	if (count === null) {
		console.error('Erreur : impossible de lire le résultat de la vérification.')
		process.exit(1)
	}
	if (count > 0) {
		console.error(`Erreur : un super_admin existe déjà. Utilisez l'interface admin pour créer des comptes supplémentaires.`)
		process.exit(1)
	}

	console.log('Hashage du mot de passe…')
	const passwordHash = await hash(password, 10)
	const now = Math.floor(Date.now() / 1000)

	// Les apostrophes des champs texte sont doublées ; le hash bcrypt n'en contient pas.
	// Le passage par fichier temporaire évite tout problème shell avec les $ du hash.
	const safeEmail = email.replace(/'/g, "''")
	const safeFirst = firstName.replace(/'/g, "''")
	const safeLast = lastName.replace(/'/g, "''")

	const sql = `INSERT INTO admins (email, first_name, last_name, password_hash, role, created_at, updated_at, must_change_password) VALUES ('${safeEmail}', '${safeFirst}', '${safeLast}', '${passwordHash}', 'super_admin', ${now}, ${now}, 0);`

	console.log('Insertion du super_admin…')
	wranglerFile(sql, remote)

	console.log(`✓ Super_admin créé avec succès.`)
	console.log(`  Email    : ${email}`)
	console.log(`  Prénom   : ${firstName}`)
	console.log(`  Nom      : ${lastName}`)
	console.log(`  Env      : ${remote ? 'remote (production)' : 'local'}`)
}

main().catch((err) => {
	console.error('Erreur inattendue :', err.message)
	process.exit(1)
})
