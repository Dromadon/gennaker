<script lang="ts">
	import type { Snippet } from 'svelte'
	let { children, data }: { children: Snippet; data: { pendingReportsCount: number } } = $props()
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between print:hidden">
		<div class="flex items-center gap-6">
			<span class="text-sm font-semibold text-gray-700">Gennaker — Admin</span>
			<a href="/admin" class="text-sm text-gray-500 hover:text-gray-900">Tableau de bord</a>
			<a href="/admin/questions" class="text-sm text-gray-500 hover:text-gray-900">Questions</a>
			<a href="/admin/reports" class="relative text-sm text-gray-500 hover:text-gray-900">
				Signalements
				{#if data.pendingReportsCount > 0}
					<span class="ml-1 inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
						{data.pendingReportsCount}
					</span>
				{/if}
			</a>
		</div>
		<form method="POST" action="/admin/logout">
			<button type="submit" class="text-sm text-gray-500 hover:text-gray-900">
				Déconnexion
			</button>
		</form>
	</nav>
	<main class="mx-auto max-w-6xl px-6 py-10">
		{@render children()}
	</main>
</div>
