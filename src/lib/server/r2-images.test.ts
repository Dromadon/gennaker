import { describe, it, expect, vi } from 'vitest'
import { extractImageRefs, deleteImagesForQuestion, deleteOrphanImages } from './r2-images'

describe('extractImageRefs', () => {
	it('retourne un ensemble vide si aucune image', () => {
		expect(extractImageRefs('Pas d\'image ici')).toEqual(new Set())
	})

	it('extrait un nom de fichier simple', () => {
		expect(extractImageRefs('![image](images/schema.png)')).toEqual(new Set(['schema.png']))
	})

	it('extrait plusieurs images', () => {
		const md = '![image](images/a.png)\n\nTexte\n\n![image](images/b.jpg)'
		expect(extractImageRefs(md)).toEqual(new Set(['a.png', 'b.jpg']))
	})

	it('déduplique les refs identiques', () => {
		const md = '![image](images/a.png) et encore ![image](images/a.png)'
		expect(extractImageRefs(md)).toEqual(new Set(['a.png']))
	})

	it('ignore les URLs absolues', () => {
		expect(extractImageRefs('![image](https://example.com/img.png)')).toEqual(new Set())
	})

	it('ignore les chemins /questions-images/', () => {
		expect(extractImageRefs('![image](/questions-images/foo/bar.png)')).toEqual(new Set())
	})

	it('fonctionne avec des noms de fichiers contenant des tirets et underscores', () => {
		expect(extractImageRefs('![alt](images/mon-image_v2.png)')).toEqual(new Set(['mon-image_v2.png']))
	})

	it('extrait depuis énoncé et correction combinés', () => {
		const question = '![image](images/q.png)'
		const correction = '![image_correction](images/c.png)'
		expect(extractImageRefs(question + '\n' + correction)).toEqual(new Set(['q.png', 'c.png']))
	})
})

describe('deleteImagesForQuestion', () => {
	function makeR2Bucket(keys: string[]) {
		return {
			list: vi.fn().mockResolvedValue({
				objects: keys.map((key) => ({ key })),
				truncated: false
			}),
			delete: vi.fn().mockResolvedValue(undefined)
		}
	}

	it('supprime toutes les images listées', async () => {
		const r2 = makeR2Bucket(['42/images/a.png', '42/images/b.jpg'])
		const result = await deleteImagesForQuestion(r2 as never, 42)
		expect(r2.delete).toHaveBeenCalledWith('42/images/a.png')
		expect(r2.delete).toHaveBeenCalledWith('42/images/b.jpg')
		expect(result.deleted).toEqual(['42/images/a.png', '42/images/b.jpg'])
		expect(result.errors).toEqual([])
	})

	it('retourne un résultat vide si aucune image', async () => {
		const r2 = makeR2Bucket([])
		const result = await deleteImagesForQuestion(r2 as never, 42)
		expect(result.deleted).toEqual([])
		expect(result.errors).toEqual([])
	})

	it('collecte les erreurs sans throw si une suppression échoue', async () => {
		const r2 = {
			list: vi.fn().mockResolvedValue({
				objects: [{ key: '42/images/a.png' }, { key: '42/images/b.jpg' }],
				truncated: false
			}),
			delete: vi
				.fn()
				.mockResolvedValueOnce(undefined)
				.mockRejectedValueOnce(new Error('R2 error'))
		}
		const result = await deleteImagesForQuestion(r2 as never, 42)
		expect(result.deleted).toEqual(['42/images/a.png'])
		expect(result.errors).toHaveLength(1)
		expect(result.errors[0]).toContain('42/images/b.jpg')
	})

	it('utilise le bon préfixe pour lister', async () => {
		const r2 = makeR2Bucket([])
		await deleteImagesForQuestion(r2 as never, 99)
		expect(r2.list).toHaveBeenCalledWith({ prefix: '99/images/' })
	})
})

describe('deleteOrphanImages', () => {
	function makeR2Bucket(keys: string[]) {
		return {
			list: vi.fn().mockResolvedValue({
				objects: keys.map((key) => ({ key })),
				truncated: false
			}),
			delete: vi.fn().mockResolvedValue(undefined)
		}
	}

	it('supprime les images R2 non référencées dans le md', async () => {
		const r2 = makeR2Bucket(['42/images/a.png', '42/images/b.jpg'])
		const result = await deleteOrphanImages(r2 as never, 42, new Set(['a.png']))
		expect(r2.delete).toHaveBeenCalledWith('42/images/b.jpg')
		expect(r2.delete).not.toHaveBeenCalledWith('42/images/a.png')
		expect(result.deleted).toEqual(['42/images/b.jpg'])
		expect(result.errors).toEqual([])
	})

	it('ne supprime rien si toutes les images sont référencées', async () => {
		const r2 = makeR2Bucket(['42/images/a.png', '42/images/b.jpg'])
		const result = await deleteOrphanImages(r2 as never, 42, new Set(['a.png', 'b.jpg']))
		expect(r2.delete).not.toHaveBeenCalled()
		expect(result.deleted).toEqual([])
	})

	it('supprime tout si aucune image n\'est référencée', async () => {
		const r2 = makeR2Bucket(['42/images/a.png', '42/images/b.jpg'])
		const result = await deleteOrphanImages(r2 as never, 42, new Set())
		expect(r2.delete).toHaveBeenCalledTimes(2)
		expect(result.deleted).toHaveLength(2)
	})

	it('ne fait rien si R2 est vide', async () => {
		const r2 = makeR2Bucket([])
		const result = await deleteOrphanImages(r2 as never, 42, new Set(['a.png']))
		expect(r2.delete).not.toHaveBeenCalled()
		expect(result.deleted).toEqual([])
	})

	it('collecte les erreurs sans throw', async () => {
		const r2 = {
			list: vi.fn().mockResolvedValue({
				objects: [{ key: '42/images/orphan.png' }],
				truncated: false
			}),
			delete: vi.fn().mockRejectedValue(new Error('R2 error'))
		}
		const result = await deleteOrphanImages(r2 as never, 42, new Set())
		expect(result.deleted).toEqual([])
		expect(result.errors).toHaveLength(1)
		expect(result.errors[0]).toContain('42/images/orphan.png')
	})
})
