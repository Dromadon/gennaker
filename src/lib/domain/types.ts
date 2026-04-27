export type Support = 'deriveur' | 'catamaran' | 'windsurf' | 'croisiere'
export type Format = 'standard' | 'raccourcie' | 'positionnement'

export type AnswerSize = 'xs' | 'sm' | 'md' | 'lg'

export type Question = {
	id: number
	sectionId: number
	title: string
	questionMd: string
	correctionMd: string
	applicableSupports: Support[]
	answerSize: AnswerSize
}

export type TemplateSlot = {
	id: number
	sectionId: number
	categoryId: number
	sectionDisplayName: string
	categoryDisplayName: string
	categorySlug: string
	sectionSlug: string
	position: number
	questionCount: number
}

export type EvaluationTemplate = {
	id: number
	support: Support
	format: Format
	slots: TemplateSlot[]
}

export type EvaluationSlot = {
	slotId: number
	sectionId: number
	categoryId: number
	sectionDisplayName: string
	categoryDisplayName: string
	categorySlug: string
	sectionSlug: string
	questions: Question[]
}

export type Evaluation = {
	support: Support
	format: Format
	slots: EvaluationSlot[]
}

export type QuestionListRow = {
	id: number
	title: string
	difficulty: 'facile' | 'moyen' | 'difficile'
	status: 'brouillon' | 'publie'
	answerSize: AnswerSize
	applicableSupports: Support[]
	categoryDisplayName: string
	sectionDisplayName: string
	categorySlug: string
	sectionSlug: string
}

export type QuestionAdminDetail = QuestionListRow & {
	sectionId: number
	questionMd: string
	correctionMd: string
	sourceMd: string | null
}

export type CategoryWithSections = {
	id: number
	slug: string
	displayName: string
	sections: { id: number; slug: string; displayName: string }[]
}
