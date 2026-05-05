import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ConsoleAdapter, sanitize, serializeError } from './console-logger'
import { createLogger, noopLogger } from './index'

describe('sanitize', () => {
	it('redacte les champs sensibles', () => {
		const result = sanitize({ password: 'secret123', token: 'abc', requestId: 'xyz' })
		expect(result.password).toBe('[REDACTED]')
		expect(result.token).toBe('[REDACTED]')
		expect(result.requestId).toBe('xyz')
	})

	it('est insensible à la casse des clés', () => {
		const result = sanitize({ Authorization: 'Bearer xyz' } as Record<string, unknown>)
		expect(result.Authorization).toBe('[REDACTED]')
	})
})

describe('serializeError', () => {
	it('sérialise une Error avec message et stack', () => {
		const err = new Error('boom')
		const result = serializeError(err)
		expect(result.errorMessage).toBe('boom')
		expect(typeof result.stack).toBe('string')
	})

	it('convertit une valeur non-Error en string', () => {
		const result = serializeError('oops')
		expect(result.errorRaw).toBe('oops')
	})
})

describe('ConsoleAdapter', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'warn').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('appelle console.log pour info', () => {
		const adapter = new ConsoleAdapter()
		adapter.send('info', 'test', { requestId: 'r1' })
		expect(console.log).toHaveBeenCalledOnce()
		const raw = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
		const parsed = JSON.parse(raw)
		expect(parsed.level).toBe('info')
		expect(parsed.message).toBe('test')
		expect(parsed.requestId).toBe('r1')
		expect(parsed.ts).toBeDefined()
	})

	it('appelle console.warn pour warn', () => {
		const adapter = new ConsoleAdapter()
		adapter.send('warn', 'attention', {})
		expect(console.warn).toHaveBeenCalledOnce()
	})

	it('appelle console.error pour error', () => {
		const adapter = new ConsoleAdapter()
		adapter.send('error', 'crash', {})
		expect(console.error).toHaveBeenCalledOnce()
	})

	it('redacte les champs sensibles dans la sortie', () => {
		const adapter = new ConsoleAdapter()
		adapter.send('info', 'test', { password: 'secret' })
		const raw = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
		const parsed = JSON.parse(raw)
		expect(parsed.password).toBe('[REDACTED]')
	})
})

describe('createLogger', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('sérialise correctement une Error via logger.error', () => {
		const adapter = new ConsoleAdapter()
		vi.spyOn(console, 'error').mockImplementation(() => {})
		const logger = createLogger(adapter, 'info')
		const err = new Error('test error')
		logger.error('something broke', err, { requestId: 'r2' })
		const raw = (console.error as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
		const parsed = JSON.parse(raw)
		expect(parsed.errorMessage).toBe('test error')
		expect(parsed.requestId).toBe('r2')
	})

	it('filtre les logs debug quand le level est info', () => {
		const adapter = new ConsoleAdapter()
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const logger = createLogger(adapter, 'info')
		logger.debug('invisible', {})
		expect(console.log).not.toHaveBeenCalled()
	})

	it('laisse passer les logs debug quand le level est debug', () => {
		const adapter = new ConsoleAdapter()
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const logger = createLogger(adapter, 'debug')
		logger.debug('visible', {})
		expect(console.log).toHaveBeenCalledOnce()
	})
})

describe('noopLogger', () => {
	it('ne lève pas d\'exception', () => {
		expect(() => {
			noopLogger.debug('x')
			noopLogger.info('x')
			noopLogger.warn('x')
			noopLogger.error('x', new Error('y'))
		}).not.toThrow()
	})
})
