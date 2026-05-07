/// <reference types="@cloudflare/workers-types" />
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			isAdmin: boolean
			adminId: number | null
			adminRole: 'admin' | 'super_admin' | null
			mustChangePassword: boolean
			logger: import('$lib/server/logger/types').Logger
			requestId: string
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database
				IMAGES: R2Bucket
				R2_PUBLIC_URL: string
				ADMIN_SESSION_SECRET: string
				LOG_LEVEL?: string
			}
		}
	}
}

export {};
