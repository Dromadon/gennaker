<script lang="ts">
	import type { PageData } from './$types'
	import type { CategoryWithSections } from '$lib/domain/types'

	let { data }: { data: PageData } = $props()

	const PAGE_SIZE = 20
	const totalPages = $derived(Math.ceil(data.total / PAGE_SIZE))

	let selectedCategory = $state(data.filters.categoryId ? String(data.filters.categoryId) : '')
	let selectedSection = $state(data.filters.sectionId ? String(data.filters.sectionId) : '')
	let selectedSupport = $state(data.filters.support ?? '')
	let selectedStatus = $state(data.filters.status ?? '')

	const visibleSections = $derived(
		selectedCategory
			? (data.categories.find((c: CategoryWithSections) => c.id === Number(selectedCategory))?.sections ?? [])
			: []
	)

	let deleteId = $state<number | null>(null)
	let deleteDialog: HTMLDialogElement

	function openDeleteDialog(id: number) {
		deleteId = id
		deleteDialog.showModal()
	}

	function buildPageUrl(page: number) {
		const p = new URLSearchParams()
		if (selectedCategory) p.set('category', selectedCategory)
		if (selectedSection) p.set('section', selectedSection)
		if (selectedSupport) p.set('support', selectedSupport)
		if (selectedStatus) p.set('status', selectedStatus)
		if (page > 1) p.set('page', String(page))
		const q = p.toString()
		return `/admin/questions${q ? '?' + q : ''}`
	}

	const supports = ['deriveur', 'catamaran', 'windsurf', 'croisiere']
</script>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-xl font-semibold text-gray-900">Questions ({data.total})</h1>
	<a
		href="/admin/questions/new"
		class="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
	>
		+ Nouvelle question
	</a>
</div>

<!-- Filtres -->
<form method="GET" class="mb-6 flex flex-wrap gap-3">
	<select
		name="category"
		bind:value={selectedCategory}
		onchange={() => { selectedSection = '' }}
		class="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
	>
		<option value="">Toutes les catégories</option>
		{#each data.categories as cat}
			<option value={String(cat.id)}>{cat.displayName}</option>
		{/each}
	</select>

	<select
		name="section"
		bind:value={selectedSection}
		disabled={!selectedCategory}
		class="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
	>
		<option value="">Toutes les sections</option>
		{#each visibleSections as sec}
			<option value={sec.id}>{sec.displayName}</option>
		{/each}
	</select>

	<select name="support" bind:value={selectedSupport} class="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
		<option value="">Tous les supports</option>
		{#each supports as s}
			<option value={s}>{s}</option>
		{/each}
	</select>

	<select name="status" bind:value={selectedStatus} class="rounded-md border border-gray-300 px-3 py-1.5 text-sm">
		<option value="">Tous les statuts</option>
		<option value="publie">Publié</option>
		<option value="brouillon">Brouillon</option>
	</select>

	<button type="submit" class="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
		Filtrer
	</button>
	<a href="/admin/questions" class="rounded-md px-4 py-1.5 text-sm text-gray-500 hover:text-gray-900">
		Réinitialiser
	</a>
</form>

<!-- Tableau -->
<div class="overflow-x-auto rounded-lg border border-gray-200">
	<table class="w-full text-sm">
		<thead class="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
			<tr>
				<th class="px-4 py-3">Titre</th>
				<th class="px-4 py-3">Catégorie / Section</th>
				<th class="px-4 py-3">Difficulté</th>
				<th class="px-4 py-3">Supports</th>
				<th class="px-4 py-3">Statut</th>
				<th class="px-4 py-3"></th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			{#each data.rows as q}
				<tr class="bg-white hover:bg-gray-50">
					<td class="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{q.title}</td>
					<td class="px-4 py-3 text-gray-500">
						{q.categoryDisplayName}<span class="mx-1 text-gray-300">/</span>{q.sectionDisplayName}
					</td>
					<td class="px-4 py-3 text-gray-500">{q.difficulty}</td>
					<td class="px-4 py-3 text-gray-500">
						{q.applicableSupports.length === 0 ? 'tous' : q.applicableSupports.join(', ')}
					</td>
					<td class="px-4 py-3">
						<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {q.status === 'publie' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
							{q.status === 'publie' ? 'Publié' : 'Brouillon'}
						</span>
					</td>
					<td class="px-4 py-3 flex gap-3 justify-end">
						<a href="/admin/questions/{q.id}/edit" class="text-blue-600 hover:underline">Modifier</a>
						<button
							type="button"
							onclick={() => openDeleteDialog(q.id)}
							class="text-red-600 hover:underline"
						>
							Supprimer
						</button>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="6" class="px-4 py-8 text-center text-gray-400">Aucune question trouvée</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<!-- Pagination -->
{#if totalPages > 1}
	<div class="mt-4 flex items-center justify-between text-sm text-gray-600">
		<span>{data.total} questions — page {data.page} / {totalPages}</span>
		<div class="flex gap-2">
			{#if data.page > 1}
				<a href={buildPageUrl(data.page - 1)} class="rounded-md border px-3 py-1 hover:bg-gray-50">← Précédent</a>
			{/if}
			{#if data.page < totalPages}
				<a href={buildPageUrl(data.page + 1)} class="rounded-md border px-3 py-1 hover:bg-gray-50">Suivant →</a>
			{/if}
		</div>
	</div>
{/if}

<!-- Dialog suppression -->
<dialog bind:this={deleteDialog} class="rounded-lg p-6 shadow-xl backdrop:bg-black/40 max-w-sm w-full">
	<h2 class="mb-2 text-base font-semibold text-gray-900">Supprimer cette question ?</h2>
	<p class="mb-6 text-sm text-gray-500">Cette action est irréversible.</p>
	<div class="flex justify-end gap-3">
		<button
			type="button"
			onclick={() => deleteDialog.close()}
			class="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
		>
			Annuler
		</button>
		<form method="POST" action="?/delete">
			<input type="hidden" name="id" value={deleteId} />
			<button
				type="submit"
				class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
			>
				Supprimer
			</button>
		</form>
	</div>
</dialog>
