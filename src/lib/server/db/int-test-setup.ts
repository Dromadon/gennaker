import type { Vitest } from 'vitest/node'
import { readD1Migrations } from '@cloudflare/vitest-pool-workers'

declare module 'vitest' {
	interface ProvidedContext {
		migrations: Awaited<ReturnType<typeof readD1Migrations>>
	}
}

export async function setup(ctx: Vitest) {
	const migrations = await readD1Migrations('./drizzle/migrations')
	ctx.provide('migrations', migrations)
}
