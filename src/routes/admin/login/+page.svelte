<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData } from './$types'
	let { form }: { form: ActionData } = $props()
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
		<h1 class="mb-6 text-lg font-semibold text-gray-900">Administration</h1>

		{#if form?.error}
			<p class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</p>
		{/if}

		<form method="POST" use:enhance>
			<label class="mb-4 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Mot de passe</span>
				<input
					type="password"
					name="password"
					required
					autofocus
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
				/>
			</label>
			<button
				type="submit"
				class="w-full rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700"
			>
				Se connecter
			</button>
		</form>
	</div>
</div>
