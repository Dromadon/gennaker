import { compare } from 'bcryptjs'

const COOKIE_NAME = 'admin_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

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
	// timing-safe comparison
	let diff = 0
	for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
	return diff === 0
}

export async function createSession(secret: string): Promise<string> {
	const payload = JSON.stringify({ iat: Date.now() })
	const encoded = btoa(payload)
	const sig = await hmac(secret, encoded)
	return `${encoded}.${sig}`
}

export async function verifySession(token: string, secret: string): Promise<boolean> {
	const dot = token.lastIndexOf('.')
	if (dot === -1) return false
	const encoded = token.slice(0, dot)
	const sig = token.slice(dot + 1)
	if (!(await verifyHmac(secret, encoded, sig))) return false
	try {
		const { iat } = JSON.parse(atob(encoded))
		return typeof iat === 'number' && Date.now() - iat < SESSION_TTL_MS
	} catch {
		return false
	}
}

export function sessionCookieHeader(token: string): string {
	const maxAge = SESSION_TTL_MS / 1000
	return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`
}

export function clearCookieHeader(): string {
	return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
}
