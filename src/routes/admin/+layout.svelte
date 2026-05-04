<script lang="ts">
	import type { Snippet } from 'svelte'
	let { children, data }: { children: Snippet; data: { pendingReportsCount: number; pendingSubmissionsCount: number; adminRole: string | null } } = $props()
	let adminMenuOpen = $state(false)
</script>

<div class="min-h-screen bg-gray-50">
	<nav class="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between print:hidden">
		<!-- Desktop : liens inline -->
		<div class="hidden lg:flex items-center gap-6">
			<span class="text-sm font-semibold text-gray-700">Gennaker — Admin</span>
			<a href="/admin" class="text-sm text-gray-500 hover:text-gray-900">Tableau de bord</a>
			<a href="/admin/questions" class="text-sm text-gray-500 hover:text-gray-900">Questions</a>
			<a href="/admin/reports" class="relative text-sm text-gray-500 hover:text-gray-900">
				Signalements
				{#if data.pendingReportsCount > 0}
					<span class="ml-1 inline-flex items-center justify-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-bold leading-none text-yellow-700">
						{data.pendingReportsCount}
					</span>
				{/if}
			</a>
			<a href="/admin/submissions" class="relative text-sm text-gray-500 hover:text-gray-900">
				Soumissions
				{#if data.pendingSubmissionsCount > 0}
					<span class="ml-1 inline-flex items-center justify-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-bold leading-none text-yellow-700">
						{data.pendingSubmissionsCount}
					</span>
				{/if}
			</a>
		</div>
		<!-- Mobile : titre + hamburger -->
		<span class="lg:hidden text-sm font-semibold text-gray-700">Gennaker — Admin</span>
		<button
			class="lg:hidden flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
			onclick={() => (adminMenuOpen = true)}
			aria-label="Menu"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
		</button>
		<!-- Desktop : profil + admins + déconnexion inline -->
		<div class="hidden lg:flex items-center gap-4">
			{#if data.adminRole === 'super_admin'}
				<a href="/admin/admins" class="text-sm text-gray-500 hover:text-gray-900">Admins</a>
			{/if}
			<a href="/admin/profile" class="text-sm text-gray-500 hover:text-gray-900">Mon profil</a>
			<form method="POST" action="/admin/logout">
				<button type="submit" class="text-sm text-gray-500 hover:text-gray-900">
					Déconnexion
				</button>
			</form>
		</div>
	</nav>

	<!-- Drawer mobile admin -->
	{#if adminMenuOpen}
		<button
			class="lg:hidden fixed inset-0 z-40 bg-black/40 print:hidden"
			onclick={() => (adminMenuOpen = false)}
			aria-label="Fermer"
		></button>
		<aside class="lg:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-xl print:hidden">
			<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
				<span class="text-sm font-semibold text-gray-700">Gennaker — Admin</span>
				<button onclick={() => (adminMenuOpen = false)} class="text-gray-400 hover:text-gray-600" aria-label="Fermer">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<nav class="flex-1 p-4 space-y-1">
				<a
					href="/admin"
					onclick={() => (adminMenuOpen = false)}
					class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
				>
					Tableau de bord
				</a>
				<a
					href="/admin/questions"
					onclick={() => (adminMenuOpen = false)}
					class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
				>
					Questions
				</a>
				<a
					href="/admin/reports"
					onclick={() => (adminMenuOpen = false)}
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
				>
					Signalements
					{#if data.pendingReportsCount > 0}
						<span class="inline-flex items-center justify-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-bold leading-none text-yellow-700">
							{data.pendingReportsCount}
						</span>
					{/if}
				</a>
				<a
					href="/admin/submissions"
					onclick={() => (adminMenuOpen = false)}
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
				>
					Soumissions
					{#if data.pendingSubmissionsCount > 0}
						<span class="inline-flex items-center justify-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-bold leading-none text-yellow-700">
							{data.pendingSubmissionsCount}
						</span>
					{/if}
				</a>
			</nav>
			<div class="border-t border-gray-200 p-4 space-y-2">
				{#if data.adminRole === 'super_admin'}
					<a
						href="/admin/admins"
						onclick={() => (adminMenuOpen = false)}
						class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
					>
						Admins
					</a>
				{/if}
				<a
					href="/admin/profile"
					onclick={() => (adminMenuOpen = false)}
					class="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
				>
					Mon profil
				</a>
				<form method="POST" action="/admin/logout">
					<button type="submit" class="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900">
						Déconnexion
					</button>
				</form>
			</div>
		</aside>
	{/if}

	<main class="mx-auto max-w-6xl px-6 py-10">
		{@render children()}
	</main>
</div>
