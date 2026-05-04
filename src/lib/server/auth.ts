import { compare } from 'bcryptjs'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type SessionPayload = {
	adminId: number
	role: 'admin' | 'super_admin'
	iat: number
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
	return compare(password, hash)
}

async function hmac(secret: string, data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	)
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

async function verifyHmac(secret: string, data: string, expected: string): Promise<boolean> {
	const actual = await hmac(secret, data)
	if (actual.length !== expected.length) return false
	// Comparaison en temps constant pour éviter les timing attacks
	let diff = 0
	for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
	return diff === 0
}

export async function createSession(
	secret: string,
	payload: Omit<SessionPayload, 'iat'>
): Promise<string> {
	const fullPayload: SessionPayload = { ...payload, iat: Date.now() }
	const encoded = btoa(JSON.stringify(fullPayload))
	const sig = await hmac(secret, encoded)
	return `${encoded}.${sig}`
}

export async function verifySession(
	token: string,
	secret: string
): Promise<SessionPayload | null> {
	const dot = token.lastIndexOf('.')
	if (dot === -1) return null
	const encoded = token.slice(0, dot)
	const sig = token.slice(dot + 1)
	if (!(await verifyHmac(secret, encoded, sig))) return null
	try {
		const payload = JSON.parse(atob(encoded))
		if (
			typeof payload.iat !== 'number' ||
			typeof payload.adminId !== 'number' ||
			(payload.role !== 'admin' && payload.role !== 'super_admin')
		) {
			return null
		}
		if (Date.now() - payload.iat >= SESSION_TTL_MS) return null
		return payload as SessionPayload
	} catch {
		return null
	}
}

export function sessionCookieHeader(token: string): string {
	const maxAge = SESSION_TTL_MS / 1000
	return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
}

export function clearCookieHeader(): string {
	return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
}
