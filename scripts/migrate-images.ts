/**
 * Gestion des images de questions.
 *
 * Mode --local  : copie les images depuis archive/ vers static/questions-images/
 *                 pour les rendre accessibles à /questions-images/... en dev local.
 *
 * Mode --remote : upload les images vers le bucket R2 via wrangler.
 *                 Requiert un compte Cloudflare et wrangler authentifié.
 *
 * Usage :
 *   npx tsx scripts/migrate-images.ts --local
 *   npx tsx scripts/migrate-images.ts --remote
 *
 * Après --local, régénérer le seed avec les URLs absolues :
 *   IMAGES_BASE_URL=/questions-images npx tsx scripts/migrate-content.ts
 *   npx wrangler d1 execute gennaker --local --file scripts/seed.sql
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { dirname, join, relative, resolve } from 'path'
import { execSync } from 'child_process'

const ROOT = resolve(import.meta.dirname, '..')
const ARCHIVE_QUESTIONS = join(ROOT, 'archive/public/questions')
const STATIC_DEST = join(ROOT, 'static/questions-images')
const R2_BUCKET = 'gennaker-questions'

const mode = process.argv[2]
if (mode !== '--local' && mode !== '--remote') {
	console.error('Usage: npx tsx scripts/migrate-images.ts --local | --remote')
	process.exit(1)
}

// Collecte récursivement tous les fichiers dans les dossiers images/
function findImages(dir: string): string[] {
	const results: string[] = []
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name)
		if (entry.isDirectory()) {
			results.push(...findImages(full))
		} else if (entry.isFile() && /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(entry.name)) {
			results.push(full)
		}
	}
	return results
}

// Filtre uniquement les fichiers dans un dossier nommé images/
const allImages = findImages(ARCHIVE_QUESTIONS).filter((p) => {
	const parts = p.split('/')
	return parts.includes('images')
})

console.log(`${allImages.length} images trouvées`)

if (mode === '--local') {
	let copied = 0
	for (const imgPath of allImages) {
		const rel = relative(ARCHIVE_QUESTIONS, imgPath)
		const dest = join(STATIC_DEST, rel)
		mkdirSync(dirname(dest), { recursive: true })
		copyFileSync(imgPath, dest)
		copied++
	}
	console.log(`✓ ${copied} images copiées dans static/questions-images/`)
	console.log()
	console.log('Régénérer le seed avec les URLs locales :')
	console.log('  IMAGES_BASE_URL=/questions-images npx tsx scripts/migrate-content.ts')
	console.log('  npx wrangler d1 execute gennaker --local --file scripts/seed.sql')
}

if (mode === '--remote') {
	let uploaded = 0
	let failed = 0
	for (const imgPath of allImages) {
		const r2Key = relative(ARCHIVE_QUESTIONS, imgPath)
		try {
			execSync(`npx wrangler r2 object put "${R2_BUCKET}/${r2Key}" --file "${imgPath}"`, {
				stdio: 'pipe'
			})
			uploaded++
			process.stdout.write(`\r  ${uploaded}/${allImages.length} uploadées...`)
		} catch {
			console.error(`\n  ✗ Échec : ${r2Key}`)
			failed++
		}
	}
	console.log(`\n✓ ${uploaded} images uploadées vers R2 (${failed} échecs)`)
	console.log()
	console.log('Régénérer le seed avec les URLs R2 :')
	console.log('  IMAGES_BASE_URL=<votre_r2_public_url> npx tsx scripts/migrate-content.ts')
	console.log('  npx wrangler d1 execute gennaker --remote --file scripts/seed.sql')
}
