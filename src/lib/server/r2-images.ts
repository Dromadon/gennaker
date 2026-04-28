export { extractImageRefs } from '$lib/markdown'

export async function deleteOrphanImages(
	r2: R2Bucket,
	questionId: number,
	referencedFilenames: Set<string>
): Promise<{ deleted: string[]; errors: string[] }> {
	const prefix = `${questionId}/images/`
	const listed = await r2.list({ prefix })
	const deleted: string[] = []
	const errors: string[] = []
	for (const obj of listed.objects) {
		const filename = obj.key.slice(prefix.length)
		if (referencedFilenames.has(filename)) continue
		try {
			await r2.delete(obj.key)
			deleted.push(obj.key)
		} catch (e) {
			errors.push(`${obj.key}: ${e instanceof Error ? e.message : String(e)}`)
		}
	}
	return { deleted, errors }
}

export async function deleteImagesForQuestion(
	r2: R2Bucket,
	questionId: number
): Promise<{ deleted: string[]; errors: string[] }> {
	const prefix = `${questionId}/images/`
	const listed = await r2.list({ prefix })
	const deleted: string[] = []
	const errors: string[] = []
	for (const obj of listed.objects) {
		try {
			await r2.delete(obj.key)
			deleted.push(obj.key)
		} catch (e) {
			errors.push(`${obj.key}: ${e instanceof Error ? e.message : String(e)}`)
		}
	}
	return { deleted, errors }
}
