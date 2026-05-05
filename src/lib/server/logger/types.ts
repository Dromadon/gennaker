export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
	requestId?: string
	method?: string
	path?: string
	status?: number
	durationMs?: number
	adminId?: number | null
	[key: string]: unknown
}

export interface Logger {
	debug(message: string, ctx?: LogContext): void
	info(message: string, ctx?: LogContext): void
	warn(message: string, ctx?: LogContext): void
	error(message: string, error?: unknown, ctx?: LogContext): void
}

export interface LoggerAdapter {
	send(level: LogLevel, message: string, ctx: LogContext): void | Promise<void>
}
