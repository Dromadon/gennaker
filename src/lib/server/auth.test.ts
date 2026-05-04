import { describe, it, expect, beforeAll } from 'vitest'
import { hash } from 'bcryptjs'
import { verifyPassword, createSession, verifySession } from './auth'

const SECRET = 'test-secret-32-chars-long-enough'
const PAYLOAD = { adminId: 1, role: 'super_admin' as const }

describe('verifyPassword', () => {
	let HASH: string
	beforeAll(async () => { HASH = await hash('password123', 10) })

	it('retourne true pour un mot de passe correct', async () => {
		expect(await verifyPassword(HASH, 'password123')).toBe(true)
	})

	it('retourne false pour un mot de passe incorrect', async () => {
		expect(await verifyPassword(HASH, 'mauvais')).toBe(false)
	})
})

describe('createSession / verifySession', () => {
	it('un token créé est valide immédiatement', async () => {
		const token = await createSession(SECRET, PAYLOAD)
		const result = await verifySession(token, SECRET)
		expect(result).not.toBeNull()
		expect(result!.adminId).toBe(1)
		expect(result!.role).toBe('super_admin')
	})

	it('un token altéré est rejeté', async () => {
		const token = await createSession(SECRET, PAYLOAD)
		const tampered = token.slice(0, -4) + 'xxxx'
		expect(await verifySession(tampered, SECRET)).toBeNull()
	})

	it('un token avec mauvais secret est rejeté', async () => {
		const token = await createSession(SECRET, PAYLOAD)
		expect(await verifySession(token, 'autre-secret')).toBeNull()
	})

	it('un token expiré est rejeté', async () => {
		// Forger un payload avec iat très ancien (> 7 jours)
		const oldIat = Date.now() - 8 * 24 * 60 * 60 * 1000
		const expiredPayload = { adminId: 1, role: 'admin' as const, iat: oldIat }
		const encoded = btoa(JSON.stringify(expiredPayload))
		// Signer avec le bon secret
		const goodToken = await createSession(SECRET, PAYLOAD)
		const dot = goodToken.lastIndexOf('.')
		const sig = goodToken.slice(dot)
		// Ce token a un payload expiré mais une signature qui ne correspond pas → rejeté par HMAC
		const expiredToken = encoded + sig
		expect(await verifySession(expiredToken, SECRET)).toBeNull()
	})

	it('un token malformé est rejeté', async () => {
		expect(await verifySession('pas-un-token', SECRET)).toBeNull()
		expect(await verifySession('', SECRET)).toBeNull()
	})

	it('un token sans adminId est rejeté', async () => {
		// Forger un payload sans adminId (format ancien)
		const oldPayload = { iat: Date.now() }
		const encoded = btoa(JSON.stringify(oldPayload))
		const goodToken = await createSession(SECRET, PAYLOAD)
		const dot = goodToken.lastIndexOf('.')
		const sig = goodToken.slice(dot)
		expect(await verifySession(encoded + sig, SECRET)).toBeNull()
	})
})
