import type { LogContext, LoggerAdapter, LogLevel } from './types'

const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'authorization', 'cookie'])

function sanitize(ctx: LogContext): Record<string, unknown> {
	const out: Record<string, unknown> = {}
	for (const [k, v] of Object.entries(ctx)) {
		out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : v
	}
	return out
}

function serializeError(err: unknown): Record<string, unknown> {
	if (err instanceof Error) {
		return { errorMessage: err.message, stack: err.stack }
	}
	return { errorRaw: String(err) }
}

export class ConsoleAdapter implements LoggerAdapter {
	send(level: LogLevel, message: string, ctx: LogContext): void {
		const entry = JSON.stringify({
			ts: new Date().toISOString(),
			level,
			message,
			...sanitize(ctx),
		})
		if (level === 'error') {
			console.error(entry)
		} else if (level === 'warn') {
			console.warn(entry)
		} else {
			console.log(entry)
		}
	}
}

export { serializeError, sanitize }
