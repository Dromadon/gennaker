import type { LogContext, Logger, LoggerAdapter, LogLevel } from './types'
import { ConsoleAdapter, serializeError } from './console-logger'

export type { Logger, LogContext, LogLevel }

// Pour basculer vers Logflare, implémenter un LoggerAdapter alternatif :
//   adapter.send(level, message, ctx) doit retourner Promise<void>
//   Poster vers https://api.logflare.app/logs avec LOGFLARE_API_KEY + LOGFLARE_SOURCE_ID
//   Appeler via platform.context.waitUntil(adapter.send(...)) pour ne pas bloquer la réponse
//   Bindings CF à ajouter dans wrangler.toml : LOGFLARE_API_KEY (secret) + LOGFLARE_SOURCE_ID (var)

export type AppLogLevel = 'info' | 'verbose' | 'debug'

function shouldLog(appLevel: AppLogLevel, minLevel: AppLogLevel): boolean {
	const order: AppLogLevel[] = ['info', 'verbose', 'debug']
	return order.indexOf(appLevel) >= order.indexOf(minLevel)
}

export function createLogger(adapter: LoggerAdapter, appLevel: AppLogLevel = 'info'): Logger {
	const send = (level: LogLevel, message: string, ctx: LogContext = {}) => {
		adapter.send(level, message, ctx)
	}

	return {
		debug(message, ctx) {
			if (shouldLog(appLevel, 'debug')) send('debug', message, ctx)
		},
		info(message, ctx) {
			send('info', message, ctx)
		},
		warn(message, ctx) {
			send('warn', message, ctx)
		},
		error(message, error, ctx) {
			send('error', message, { ...ctx, ...(error !== undefined ? serializeError(error) : {}) })
		},
	}
}

export function createConsoleLogger(appLevel: AppLogLevel = 'info'): Logger {
	return createLogger(new ConsoleAdapter(), appLevel)
}

export const noopLogger: Logger = {
	debug() {},
	info() {},
	warn() {},
	error() {},
}
