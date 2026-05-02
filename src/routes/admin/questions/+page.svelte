<script lang="ts">
	import { page } from '$app/state'
	import type { PageData } from './$types'
	import type { CategoryWithSections } from '$lib/domain/types'
	import type { QuestionRow } from '$lib/domain/types'
	import QuestionPreview from '$lib/components/QuestionPreview.svelte'

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

	let selectedQuestion = $state<QuestionRow | null>(null)

	let deleteId = $state<number | null>(null)
	let deleteConfirm = $state('')
	let deleteDialog: HTMLDialogElement

	function openDeleteDialog(id: number) {
		deleteId = id
		deleteConfirm = ''
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

	const PROBLEM_LABELS: Record<string, string> = {
		enonce_incorrect: 'Énoncé incorrect',
		correction_incorrecte: 'Correction incorrecte',
		question_doublon: 'Doublon',
		mise_en_forme: 'Mise en forme',
		autre: 'Autre'
	}

	const STATUS_BADGE: Record<string, string> = {
		nouveau: 'bg-yellow-100 text-yellow-700',
		resolu: 'bg-green-100 text-green-700'
	}

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}
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

<div class="lg:flex lg:gap-6">
	<!-- Colonne principale -->
	<div class="min-w-0 transition-all duration-300 {selectedQuestion ? 'lg:w-96 lg:shrink-0' : 'flex-1'} overflow-hidden">
		<!-- Tableau -->
		<div class="overflow-x-auto rounded-lg border border-gray-200">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
					<tr>
						<th class="w-10 px-2 py-3 text-gray-400">ID</th>
						<th class="px-2 py-3">Titre</th>
						{#if !selectedQuestion}
							<th class="px-4 py-3">Catégorie / Section</th>
							<th class="px-4 py-3">Difficulté</th>
							<th class="px-4 py-3">Supports</th>
							<th class="px-4 py-3">Statut</th>
						{/if}
						<th class="w-8 px-2 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.rows as q}
						<tr
							class="cursor-pointer hover:bg-gray-50 {selectedQuestion?.id === q.id ? 'bg-blue-50 hover:bg-blue-50' : 'bg-white'}"
							onclick={() => { selectedQuestion = q }}
						>
							<td class="w-10 px-2 py-3 text-gray-400 tabular-nums">{q.id}</td>
							<td class="px-2 py-3 font-medium text-gray-900 truncate {selectedQuestion ? 'max-w-[120px]' : 'max-w-xs'}">{q.title}</td>
							{#if !selectedQuestion}
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
							{/if}
							<td class="w-8 px-2 py-3 text-center">
								{#if (data.reportsByQuestionId[q.id] ?? []).length > 0}
									<span
										class="inline-flex items-center justify-center rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-700"
										title="{data.reportsByQuestionId[q.id].length} signalement{data.reportsByQuestionId[q.id].length > 1 ? 's' : ''}"
									>{data.reportsByQuestionId[q.id].length}</span>
								{/if}
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan={selectedQuestion ? 3 : 7} class="px-4 py-8 text-center text-gray-400">Aucune question trouvée</td>
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
	</div>

	<!-- Panneau de prévisualisation desktop -->
	{#if selectedQuestion}
		<div class="hidden lg:block lg:min-w-0 lg:flex-1">
			<div class="sticky top-4 space-y-4 rounded-lg border border-gray-200 bg-white p-5">
				<!-- En-tête -->
				<div class="flex items-start justify-between gap-2">
					<p class="text-xs text-gray-400 tabular-nums">#{selectedQuestion.id}</p>
					<button
						type="button"
						onclick={() => { selectedQuestion = null }}
						class="shrink-0 text-gray-400 hover:text-gray-700"
						aria-label="Fermer"
					>✕</button>
				</div>

				<!-- Actions -->
				<div class="flex gap-2">
					<a
						href="/admin/questions/{selectedQuestion.id}/edit"
						class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-100"
					>
						Modifier →
					</a>
					<button
						type="button"
						onclick={() => openDeleteDialog(selectedQuestion!.id)}
						class="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:border-red-400 hover:bg-red-100"
					>
						Supprimer
					</button>
				</div>

				<hr class="border-gray-200" />

				<!-- Prévisualisation de la question -->
				<QuestionPreview
					questionId={selectedQuestion.id}
					title={selectedQuestion.title}
					categoryDisplayName={selectedQuestion.categoryDisplayName}
					sectionDisplayName={selectedQuestion.sectionDisplayName}
					difficulty={selectedQuestion.difficulty}
					applicableSupports={selectedQuestion.applicableSupports}
					questionMd={selectedQuestion.questionMd}
					correctionMd={selectedQuestion.correctionMd}
					sourceMd={selectedQuestion.sourceMd}
					r2BaseUrl={page.data.r2BaseUrl}
				/>

				<!-- Signalements liés -->
				<hr class="border-gray-200" />
				{#if (data.reportsByQuestionId[selectedQuestion.id] ?? []).length === 0}
					<p class="text-sm text-gray-400">Aucun signalement</p>
				{:else}
					{@const reports = data.reportsByQuestionId[selectedQuestion.id]}
					<p class="text-sm font-medium text-gray-700">{reports.length} signalement{reports.length > 1 ? 's' : ''}</p>
					<div class="space-y-2">
						{#each reports as report}
							<details class="group/report rounded-md border border-gray-100">
								<summary class="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
									<span class="font-medium">{PROBLEM_LABELS[report.problemType] ?? report.problemType}</span>
									<div class="flex items-center gap-2">
										<span class="text-gray-400">{formatDate(report.createdAt)}</span>
										<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[report.status]}">
											{report.status === 'nouveau' ? 'Nouveau' : 'Résolu'}
										</span>
										<span class="text-gray-300 transition-transform group-open/report:rotate-90">▶</span>
									</div>
								</summary>
								<div class="space-y-2 border-t border-gray-100 px-3 py-2 text-xs text-gray-600">
									<p class="whitespace-pre-wrap">{report.description ?? '—'}</p>
									{#if report.email}
										<p class="text-gray-400">{report.email}</p>
									{/if}
								</div>
							</details>
						{/each}
						<a href="/admin/reports" class="mt-1 block text-right text-xs text-blue-600 hover:underline">
							Voir tous les signalements →
						</a>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Panneau de prévisualisation mobile (plein écran) -->
{#if selectedQuestion}
	<div class="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
			<p class="truncate text-xs text-gray-400 tabular-nums">#{selectedQuestion.id}</p>
			<button
				type="button"
				onclick={() => { selectedQuestion = null }}
				class="ml-2 shrink-0 text-gray-400 hover:text-gray-700"
				aria-label="Fermer"
			>✕ Fermer</button>
		</div>
		<div class="flex-1 overflow-y-auto p-4 space-y-4">
			<div class="flex gap-2">
				<a
					href="/admin/questions/{selectedQuestion.id}/edit"
					class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-100"
				>
					Modifier →
				</a>
				<button
					type="button"
					onclick={() => openDeleteDialog(selectedQuestion!.id)}
					class="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:border-red-400 hover:bg-red-100"
				>
					Supprimer
				</button>
			</div>

			<hr class="border-gray-200" />

			<QuestionPreview
				questionId={selectedQuestion.id}
				title={selectedQuestion.title}
				categoryDisplayName={selectedQuestion.categoryDisplayName}
				sectionDisplayName={selectedQuestion.sectionDisplayName}
				difficulty={selectedQuestion.difficulty}
				applicableSupports={selectedQuestion.applicableSupports}
				questionMd={selectedQuestion.questionMd}
				correctionMd={selectedQuestion.correctionMd}
				sourceMd={selectedQuestion.sourceMd}
				r2BaseUrl={page.data.r2BaseUrl}
			/>

			<hr class="border-gray-200" />

			{#if (data.reportsByQuestionId[selectedQuestion.id] ?? []).length === 0}
				<p class="text-sm text-gray-400">Aucun signalement</p>
			{:else}
				{@const reports = data.reportsByQuestionId[selectedQuestion.id]}
				<p class="text-sm font-medium text-gray-700">{reports.length} signalement{reports.length > 1 ? 's' : ''}</p>
				<div class="space-y-2">
					{#each reports as report}
						<details class="group/report rounded-md border border-gray-100">
							<summary class="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs text-gray-600 hover:bg-gray-50">
								<span class="font-medium">{PROBLEM_LABELS[report.problemType] ?? report.problemType}</span>
								<div class="flex items-center gap-2">
									<span class="text-gray-400">{formatDate(report.createdAt)}</span>
									<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[report.status]}">
										{report.status === 'nouveau' ? 'Nouveau' : 'Résolu'}
									</span>
									<span class="text-gray-300 transition-transform group-open/report:rotate-90">▶</span>
								</div>
							</summary>
							<div class="space-y-2 border-t border-gray-100 px-3 py-2 text-xs text-gray-600">
								<p class="whitespace-pre-wrap">{report.description ?? '—'}</p>
								{#if report.email}
									<p class="text-gray-400">{report.email}</p>
								{/if}
							</div>
						</details>
					{/each}
					<a href="/admin/reports" class="mt-1 block text-right text-xs text-blue-600 hover:underline">
						Voir tous les signalements →
					</a>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Dialog suppression -->
<dialog bind:this={deleteDialog} class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-6 shadow-xl backdrop:bg-black/40 w-full max-w-sm">
	<h2 class="mb-2 text-base font-semibold text-gray-900">Supprimer cette question ?</h2>
	<p class="mb-4 text-sm text-gray-500">Cette action est irréversible. Tape <strong class="text-gray-700">suppression</strong> pour confirmer.</p>
	<input
		type="text"
		bind:value={deleteConfirm}
		placeholder="suppression"
		class="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
	/>
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
				disabled={deleteConfirm !== 'suppression'}
				class="rounded-md px-4 py-2 text-sm font-medium text-white transition {deleteConfirm === 'suppression' ? 'bg-red-600 hover:bg-red-700' : 'bg-red-200 cursor-not-allowed'}"
			>
				Supprimer
			</button>
		</form>
	</div>
</dialog>
