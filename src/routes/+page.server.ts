import type { PageServerLoad } from './$types'
import { getActiveSupports } from '$lib/server/db/queries/supports'
import type { Support } from '$lib/domain/types'

const SUPPORT_LABELS: Record<Support, string> = {
	deriveur: 'Dériveur',
	catamaran: 'Catamaran',
	windsurf: 'Windsurf',
	croisiere: 'Croisière'
}

const FORMATS = [
	{ value: 'standard', label: 'Standard (~16 questions)' },
	{ value: 'raccourcie', label: 'Raccourcie (~8 questions)' },
	{ value: 'positionnement', label: 'Positionnement (~6 questions)' }
] as const

export const load: PageServerLoad = async ({ platform }) => {
	let activeSupportSlugs: Support[]

	if (!platform?.env?.DB) {
		// Développement local sans D1 — valeurs par défaut
		activeSupportSlugs = ['deriveur', 'catamaran', 'windsurf']
	} else {
		activeSupportSlugs = await getActiveSupports(platform.env.DB)
	}

	const activeSupports = activeSupportSlugs.map((slug) => ({
		value: slug,
		label: SUPPORT_LABELS[slug]
	}))

	return { activeSupports, formats: FORMATS }
}
