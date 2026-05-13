export const PROBLEM_LABELS: Record<string, string> = {
	enonce_incorrect: 'Énoncé incorrect',
	correction_incorrecte: 'Correction incorrecte',
	question_doublon: 'Doublon',
	mise_en_forme: 'Mise en forme',
	autre: 'Autre'
}

export const REPORT_STATUS_LABELS: Record<string, string> = {
	nouveau: 'Nouveau',
	resolu: 'Résolu'
}

export const REPORT_STATUS_BADGE: Record<string, string> = {
	nouveau: 'bg-yellow-100 text-yellow-700',
	resolu: 'bg-green-100 text-green-700'
}

export const SUBMISSION_STATUS_LABELS: Record<string, string> = {
	en_attente: 'En attente',
	approuve: 'Approuvé',
	rejete: 'Rejeté'
}

export const SUBMISSION_STATUS_BADGE: Record<string, string> = {
	en_attente: 'bg-yellow-100 text-yellow-700',
	approuve: 'bg-green-100 text-green-700',
	rejete: 'bg-red-100 text-red-700'
}

export const SUPPORT_LABELS: Record<string, string> = {
	deriveur: 'Dériveur',
	catamaran: 'Catamaran',
	windsurf: 'Windsurf',
	croisiere: 'Croisière'
}

export const FORMAT_LABELS: Record<string, string> = {
	standard: 'Standard',
	raccourcie: 'Raccourcie',
	positionnement: 'Positionnement'
}

export const SUPPORT_SLUGS = ['deriveur', 'catamaran', 'windsurf', 'croisiere'] as const
export const FORMAT_SLUGS = ['standard', 'raccourcie', 'positionnement'] as const
