import { describe, it, expect, vi } from 'vitest'
import { load } from './+layout.server'

vi.mock('$lib/server/db/queries/reports', () => ({
	countPendingReports: vi.fn().mockResolvedValue(3)
}))

vi.mock('$lib/server/db/queries/submissions', () => ({
	countPendingSubmissions: vi.fn().mockResolvedValue(0)
}))

function makeLocals(isAdmin: boolean, adminRole: 'admin' | 'super_admin' | null = null) {
	return { isAdmin, adminId: isAdmin ? 1 : null, adminRole }
}

async function callLoad(isAdmin: boolean, pathname: string, adminRole: 'admin' | 'super_admin' | null = null) {
	return load({
		locals: makeLocals(isAdmin, adminRole),
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

	it('retourne pendingReportsCount, pendingSubmissionsCount et adminRole si authentifié', async () => {
		const result = await callLoad(true, '/admin', 'admin')
		expect(result).toEqual({ pendingReportsCount: 3, pendingSubmissionsCount: 0, adminRole: 'admin' })
	})

	it('retourne les compteurs à 0 et adminRole null si sur /admin/login sans session', async () => {
		const result = await callLoad(false, '/admin/login')
		expect(result).toEqual({ pendingReportsCount: 0, pendingSubmissionsCount: 0, adminRole: null })
	})
})
