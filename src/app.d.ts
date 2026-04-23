/// <reference types="@cloudflare/workers-types" />
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database
				IMAGES: R2Bucket
				R2_PUBLIC_URL: string
				ADMIN_EMAIL: string
				RESEND_API_KEY: string
			}
		}
	}
}

export {};
