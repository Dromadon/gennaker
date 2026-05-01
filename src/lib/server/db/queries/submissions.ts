import { getDb } from '../index'
import { communitySubmissions } from '../schema'

export type SubmissionInput = {
	sectionId: number
	title: string
	questionMd: string
	correctionMd: string
	applicableSupports: string[]
	submitterName: string
	submitterEmail: string
}

export async function createCommunitySubmission(
	d1: D1Database,
	data: SubmissionInput
): Promise<number> {
	const db = getDb(d1)
	const result = await db
		.insert(communitySubmissions)
		.values({
			sectionId: data.sectionId,
			title: data.title,
			questionMd: data.questionMd,
			correctionMd: data.correctionMd,
			applicableSupports: JSON.stringify(data.applicableSupports),
			submitterName: data.submitterName,
			submitterEmail: data.submitterEmail,
			status: 'en_attente',
			createdAt: Math.floor(Date.now() / 1000)
		})
		.returning({ id: communitySubmissions.id })
	return result[0].id
}
