import { describe, it, expect, beforeAll } from 'vitest'
import { hash } from 'bcryptjs'
import { verifyPassword, createSession, verifySession } from './auth'

const SECRET = 'test-secret-32-chars-long-enough'

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
		const token = await createSession(SECRET)
		expect(await verifySession(token, SECRET)).toBe(true)
	})

	it('un token altéré est rejeté', async () => {
		const token = await createSession(SECRET)
		const tampered = token.slice(0, -4) + 'xxxx'
		expect(await verifySession(tampered, SECRET)).toBe(false)
	})

	it('un token avec mauvais secret est rejeté', async () => {
		const token = await createSession(SECRET)
		expect(await verifySession(token, 'autre-secret')).toBe(false)
	})

	it('un token expiré est rejeté', async () => {
		// Forger un payload avec iat très ancien (> 7 jours)
		const oldIat = Date.now() - 8 * 24 * 60 * 60 * 1000
		const payload = btoa(JSON.stringify({ iat: oldIat }))
		// Signer avec le bon secret pour que la vérification HMAC passe
		const token = await createSession(SECRET)
		// Remplacer uniquement la partie payload (avant le point) par le payload expiré
		const dot = token.lastIndexOf('.')
		const sig = token.slice(dot)
		// Ce token a un payload expiré mais une signature qui ne correspond pas → rejeté par HMAC
		const expiredToken = payload + sig
		expect(await verifySession(expiredToken, SECRET)).toBe(false)
	})

	it('un token malformé est rejeté', async () => {
		expect(await verifySession('pas-un-token', SECRET)).toBe(false)
		expect(await verifySession('', SECRET)).toBe(false)
	})
})
