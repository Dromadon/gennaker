import { defineConfig } from 'vitest/config'
import { cloudflarePool, cloudflareTest } from '@cloudflare/vitest-pool-workers'

const poolOptions = {
	main: './src/lib/server/db/test-worker.ts',
	wrangler: { configPath: './wrangler.toml' },
	miniflare: {
		d1Databases: ['DB']
	}
}

export default defineConfig({
	plugins: [cloudflareTest(poolOptions)],
	test: {
		include: ['src/**/*.int.test.ts'],
		globalSetup: ['./src/lib/server/db/int-test-setup.ts'],
		pool: cloudflarePool(poolOptions)
	}
})
