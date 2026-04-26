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
