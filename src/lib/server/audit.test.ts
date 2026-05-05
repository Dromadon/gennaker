import { describe, it, expect } from 'vitest'
import {
	buildQuestionAuditMetadata,
	buildSubmissionAuditMetadata,
	buildReportAuditMetadata,
	questionSnapshot
} from './audit'
import type { QuestionAdminDetail } from '$lib/domain/types'
import type { SubmissionDetail } from '$lib/server/db/queries/submissions'

const makeQuestion = (overrides: Partial<QuestionAdminDetail> = {}): QuestionAdminDetail => ({
	id: 1,
	title: 'Ma question',
	sectionId: 2,
	difficulty: 'moyen',
	answerSize: 'md',
	status: 'brouillon',
	applicableSupports: ['deriveur'],
	sourceMd: null,
	questionMd: 'Énoncé',
	correctionMd: 'Correction',
	categoryDisplayName: 'Catégorie',
	sectionDisplayName: 'Section',
	categorySlug: 'cat',
	sectionSlug: 'sec',
	...overrides
})

const makeSubmission = (overrides: Partial<SubmissionDetail> = {}): SubmissionDetail => ({
	id: 10,
	title: 'Ma soumission',
	questionMd: 'Énoncé',
	correctionMd: 'Correction',
	applicableSupports: '["deriveur"]',
	submitterName: 'Jean Dupont',
	submitterEmail: 'jean@example.com',
	sectionId: 2,
	sectionDisplayName: 'Section',
	categoryDisplayName: 'Catégorie',
	status: 'en_attente',
	rejectionNote: null,
	approvedQuestionId: null,
	createdAt: 1000000,
	...overrides
})

describe('questionSnapshot', () => {
	it('extrait les champs attendus sans les champs de display', () => {
		const q = makeQuestion()
		const snap = questionSnapshot(q)
		expect(snap).toEqual({
			id: 1,
			title: 'Ma question',
			sectionId: 2,
			difficulty: 'moyen',
			answerSize: 'md',
			status: 'brouillon',
			applicableSupports: ['deriveur'],
			sourceMd: null,
			questionMd: 'Énoncé',
			correctionMd: 'Correction'
		})
		expect(snap).not.toHaveProperty('categoryDisplayName')
		expect(snap).not.toHaveProperty('sectionDisplayName')
	})
})

describe('buildQuestionAuditMetadata', () => {
	it('retourne before: null pour une création', () => {
		const after = makeQuestion()
		const result = buildQuestionAuditMetadata(null, after)
		expect(result.before).toBeNull()
		expect(result.after).toMatchObject({ id: 1, title: 'Ma question' })
	})

	it('retourne after: null pour une suppression', () => {
		const before = makeQuestion()
		const result = buildQuestionAuditMetadata(before, null)
		expect(result.after).toBeNull()
		expect(result.before).toMatchObject({ id: 1, title: 'Ma question' })
	})

	it('retourne before et after pour une modification', () => {
		const before = makeQuestion({ title: 'Ancien titre', status: 'brouillon' })
		const after = makeQuestion({ title: 'Nouveau titre', status: 'publie' })
		const result = buildQuestionAuditMetadata(before, after)
		expect((result.before as Record<string, unknown>).title).toBe('Ancien titre')
		expect((result.after as Record<string, unknown>).title).toBe('Nouveau titre')
		expect((result.before as Record<string, unknown>).status).toBe('brouillon')
		expect((result.after as Record<string, unknown>).status).toBe('publie')
	})
})

describe('buildSubmissionAuditMetadata', () => {
	it('inclut les champs de base de la soumission', () => {
		const sub = makeSubmission()
		const result = buildSubmissionAuditMetadata(sub)
		expect(result).toMatchObject({
			submissionId: 10,
			title: 'Ma soumission',
			submitterName: 'Jean Dupont',
			submitterEmail: 'jean@example.com'
		})
		expect(result).not.toHaveProperty('newQuestionId')
		expect(result).not.toHaveProperty('rejectionNote')
	})

	it('inclut newQuestionId lors d\'une approbation', () => {
		const sub = makeSubmission()
		const result = buildSubmissionAuditMetadata(sub, { newQuestionId: 42 })
		expect(result.newQuestionId).toBe(42)
	})

	it('inclut rejectionNote lors d\'un rejet', () => {
		const sub = makeSubmission()
		const result = buildSubmissionAuditMetadata(sub, { rejectionNote: 'Hors sujet' })
		expect(result.rejectionNote).toBe('Hors sujet')
	})

	it('n\'inclut pas rejectionNote si elle est null', () => {
		const sub = makeSubmission()
		const result = buildSubmissionAuditMetadata(sub, { rejectionNote: null })
		expect(result).not.toHaveProperty('rejectionNote')
	})
})

describe('buildReportAuditMetadata', () => {
	it('retourne les champs attendus pour report.resolve', () => {
		const result = buildReportAuditMetadata(5, 99, 'resolu')
		expect(result).toEqual({ reportId: 5, questionId: 99, newStatus: 'resolu' })
	})

	it('retourne les champs attendus pour report.reopen', () => {
		const result = buildReportAuditMetadata(5, 99, 'nouveau')
		expect(result).toEqual({ reportId: 5, questionId: 99, newStatus: 'nouveau' })
	})
})
