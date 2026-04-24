import { describe, it, expect } from 'vitest'
import { load } from './+layout.server'

async function callLoad(isAdmin: boolean, pathname: string) {
	return load({
		locals: { isAdmin },
		url: new URL(`http://localhost${pathname}`)
	} as Parameters<typeof load>[0])
}

describe('guard /admin', () => {
	it('redirige vers /admin/login si non authentifié', async () => {
		await expect(callLoad(false, '/admin')).rejects.toMatchObject({
			status: 302,
			location: '/admin/login'
		})
	})

	it('redirige vers /admin/login si non authentifié sur /admin/export', async () => {
		await expect(callLoad(false, '/admin/export')).rejects.toMatchObject({
			status: 302,
			location: '/admin/login'
		})
	})

	it('ne redirige pas si authentifié', async () => {
		const result = await callLoad(true, '/admin')
		expect(result).toBeUndefined()
	})

	it('ne redirige pas si déjà sur /admin/login (même sans session)', async () => {
		const result = await callLoad(false, '/admin/login')
		expect(result).toBeUndefined()
	})
})
