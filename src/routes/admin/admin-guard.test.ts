import { describe, it, expect, vi } from 'vitest'
import { load } from './+layout.server'

vi.mock('$lib/server/db/queries/reports', () => ({
	countPendingReports: vi.fn().mockResolvedValue(3)
}))

async function callLoad(isAdmin: boolean, pathname: string) {
	return load({
		locals: { isAdmin },
		url: new URL(`http://localhost${pathname}`),
		platform: { env: { DB: {} } }
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

	it('retourne pendingReportsCount si authentifié', async () => {
		const result = await callLoad(true, '/admin')
		expect(result).toEqual({ pendingReportsCount: 3 })
	})

	it('retourne pendingReportsCount=0 si sur /admin/login sans session', async () => {
		const result = await callLoad(false, '/admin/login')
		expect(result).toEqual({ pendingReportsCount: 0 })
	})
})
