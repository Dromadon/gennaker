<script lang="ts">
	import type { Snippet } from 'svelte'
	let { children }: { children: Snippet } = $props()
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between print:hidden">
		<span class="text-sm font-semibold text-gray-700">Gennaker — Admin</span>
		<form method="POST" action="/admin/logout">
			<button type="submit" class="text-sm text-gray-500 hover:text-gray-900">
				Déconnexion
			</button>
		</form>
	</nav>
	<main class="mx-auto max-w-3xl px-6 py-10">
		{@render children()}
	</main>
</div>
