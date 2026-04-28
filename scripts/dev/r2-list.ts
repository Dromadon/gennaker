/**
 * Liste les clés R2 du bucket local miniflare.
 * Usage :
 *   NODE_OPTIONS=--experimental-sqlite npx tsx scripts/dev/r2-list.ts        # toutes les clés
 *   NODE_OPTIONS=--experimental-sqlite npx tsx scripts/dev/r2-list.ts <id>   # images d'une question
 */

import { DatabaseSync } from 'node:sqlite'
import { readdirSync } from 'node:fs'

const dir = '.wrangler/state/v3/r2/miniflare-R2BucketObject'
const file = readdirSync(dir).find((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
if (!file) { console.error('Aucun fichier R2 local trouvé.'); process.exit(1) }

const db = new DatabaseSync(`${dir}/${file}`)
const id = process.argv[2]

if (id) {
  const rows = db.prepare('SELECT key FROM _mf_objects WHERE key LIKE ? ORDER BY key').all(`${id}/images/%`)
  if (rows.length === 0) console.log(`Aucune image pour la question ${id}.`)
  else rows.forEach((r) => console.log(r.key))
} else {
  const rows = db.prepare('SELECT key FROM _mf_objects ORDER BY key').all()
  if (rows.length === 0) console.log('Bucket R2 local vide.')
  else rows.forEach((r) => console.log(r.key))
}
