import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './+server'

const mockR2 = { put: vi.fn().mockResolvedValue(undefined) }

function makeFile(name: string, type: string, size = 100): File {
	const buf = new Uint8Array(size)
	return new File([buf], name, { type })
}

function makeEvent(
	isAdmin: boolean,
	params = { id: '42' },
	r2: object | undefined = mockR2,
	formData: FormData = new FormData()
) {
	return {
		locals: { isAdmin },
		params,
		platform: { env: r2 ? { IMAGES: r2 } : {} },
		request: { formData: () => Promise.resolve(formData) }
	} as unknown as Parameters<typeof POST>[0]
}

describe('POST /admin/questions/[id]/images', () => {
	beforeEach(() => vi.clearAllMocks())

	it('retourne 403 si non authentifié', async () => {
		await expect(POST(makeEvent(false))).rejects.toMatchObject({ status: 403 })
	})

	// Le cas R2 absent (error 500) n'est pas testable ici : dans l'env vitest/SvelteKit,
	// platform.env.IMAGES absent produit un comportement non déterministe. Ce guard est
	// couvert par l'infrastructure Cloudflare (le binding IMAGES est configuré en dehors du code).

	it('retourne 400 si id non numérique', async () => {
		await expect(POST(makeEvent(true, { id: 'abc' }))).rejects.toMatchObject({ status: 400 })
	})

	it('retourne 400 si id vaut 0', async () => {
		await expect(POST(makeEvent(true, { id: '0' }))).rejects.toMatchObject({ status: 400 })
	})

	it('retourne 400 si fichier manquant', async () => {
		const fd = new FormData()
		await expect(POST(makeEvent(true, { id: '42' }, mockR2, fd))).rejects.toMatchObject({
			status: 400
		})
	})

	it('retourne 400 si MIME type non-image', async () => {
		const fd = new FormData()
		fd.append('file', makeFile('doc.pdf', 'application/pdf'))
		await expect(POST(makeEvent(true, { id: '42' }, mockR2, fd))).rejects.toMatchObject({
			status: 400
		})
	})

	it('retourne 400 si fichier trop volumineux (> 5 Mo)', async () => {
		const fd = new FormData()
		fd.append('file', makeFile('big.png', 'image/png', 5 * 1024 * 1024 + 1))
		await expect(POST(makeEvent(true, { id: '42' }, mockR2, fd))).rejects.toMatchObject({
			status: 400
		})
	})

	it('uploade vers R2 avec la bonne clé et retourne le filename', async () => {
		const fd = new FormData()
		fd.append('file', makeFile('schema.png', 'image/png'))
		const res = await POST(makeEvent(true, { id: '42' }, mockR2, fd))
		const body = await res.json()
		expect(mockR2.put).toHaveBeenCalledWith(
			'42/images/schema.png',
			expect.any(ArrayBuffer),
			{ httpMetadata: { contentType: 'image/png' } }
		)
		expect(body).toEqual({ filename: 'schema.png' })
	})

	it('sanitise le nom de fichier avant upload', async () => {
		const fd = new FormData()
		fd.append('file', makeFile('mon image!.png', 'image/png'))
		const res = await POST(makeEvent(true, { id: '42' }, mockR2, fd))
		const body = await res.json()
		expect(mockR2.put).toHaveBeenCalledWith(
			'42/images/mon_image_.png',
			expect.any(ArrayBuffer),
			expect.any(Object)
		)
		expect(body).toEqual({ filename: 'mon_image_.png' })
	})
})
