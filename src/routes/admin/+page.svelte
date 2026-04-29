<script lang="ts">
	const date = new Date().toISOString().slice(0, 10)

	let { data }: { data: { pendingReportsCount: number } } = $props()
</script>

<h1 class="mb-8 text-xl font-semibold text-gray-900">Tableau de bord</h1>

<section class="mb-6 rounded-lg border border-gray-200 bg-white p-6">
	<h2 class="mb-1 text-sm font-semibold text-gray-700">Questions</h2>
	<p class="mb-4 text-sm text-gray-500">
		Gérer la banque de questions : liste, création, modification et suppression.
	</p>
	<a
		href="/admin/questions"
		class="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
	>
		Gérer les questions
	</a>
</section>

<section class="mb-6 rounded-lg border border-gray-200 bg-white p-6">
	<div class="mb-1 flex items-center gap-2">
		<h2 class="text-sm font-semibold text-gray-700">Signalements</h2>
		{#if data.pendingReportsCount > 0}
			<span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
				{data.pendingReportsCount} nouveau{data.pendingReportsCount > 1 ? 'x' : ''}
			</span>
		{/if}
	</div>
	<p class="mb-4 text-sm text-gray-500">
		Consulter et traiter les problèmes signalés par les utilisateurs sur les questions.
	</p>
	<a
		href="/admin/reports"
		class="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
	>
		Voir les signalements
	</a>
</section>

<section class="rounded-lg border border-gray-200 bg-white p-6">
	<h2 class="mb-1 text-sm font-semibold text-gray-700">Sauvegarde</h2>
	<p class="mb-4 text-sm text-gray-500">
		Télécharge un export complet du contenu (questions, templates et images) au format ZIP.
	</p>
	<a
		href="/admin/export"
		download="gennaker-backup-{date}.zip"
		class="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
	>
		<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
		</svg>
		Télécharger le backup
	</a>
</section>
