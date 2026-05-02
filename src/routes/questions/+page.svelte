<script lang="ts">
	import { page } from '$app/state'
	import type { PageData } from './$types'
	import type { CategoryWithSections } from '$lib/domain/types'
	import type { QuestionRow } from '$lib/domain/types'
	import ReportModal from '$lib/components/ReportModal.svelte'
	import QuestionPreview from '$lib/components/QuestionPreview.svelte'

	let { data }: { data: PageData } = $props()

	let reportQuestionId = $state<number | null>(null)
	let reportQuestionTitle = $state('')
	let reportSuccessId = $state<number | null>(null)

	const PAGE_SIZE = 20
	const totalPages = $derived(Math.ceil(data.total / PAGE_SIZE))

	let selectedCategory = $state(data.filters.categoryId ? String(data.filters.categoryId) : '')
	let selectedSection = $state(data.filters.sectionId ? String(data.filters.sectionId) : '')
	let selectedSupport = $state(data.filters.support ?? '')

	const visibleSections = $derived(
		selectedCategory
			? (data.categories.find((c: CategoryWithSections) => c.id === Number(selectedCategory))?.sections ?? [])
			: []
	)

	let selectedQuestion = $state<QuestionRow | null>(null)

	function buildPageUrl(p: number) {
		const params = new URLSearchParams()
		if (selectedCategory) params.set('category', selectedCategory)
		if (selectedSection) params.set('section', selectedSection)
		if (selectedSupport) params.set('support', selectedSupport)
		if (p > 1) params.set('page', String(p))
		const q = params.toString()
		return `/questions${q ? '?' + q : ''}`
	}

	const supports = ['deriveur', 'catamaran', 'windsurf', 'croisiere']
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-6xl px-6 py-8">
		<div class="mb-6 flex items-center justify-between gap-4">
			<h1 class="min-w-0 text-xl font-semibold text-gray-900">Banque de questions ({data.total})</h1>
			<a
				href="/soumettre"
				class="inline-flex items-center gap-2 rounded-md bg-yellow-400 hover:bg-yellow-500 px-4 py-2 text-sm font-medium text-gray-900"
			>
				+ Proposer une question
			</a>
		</div>

		<!-- Filtres -->
		<form method="GET" class="mb-6 flex flex-wrap items-center gap-3">
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

			<button type="submit" class="rounded-md bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200">
				Filtrer
			</button>
			<a href="/questions" class="rounded-md px-4 py-1.5 text-sm text-gray-500 hover:text-gray-900">
				Réinitialiser
			</a>
		</form>

		<!-- Layout dynamique -->
		<div class="lg:flex lg:gap-6">
			<!-- Liste -->
			<div class="min-w-0 transition-all duration-300 {selectedQuestion ? 'lg:w-96 lg:shrink-0' : 'flex-1'} overflow-hidden">
				<div class="overflow-x-auto rounded-lg border border-gray-200">
					<table class="w-full text-sm">
						<thead class="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
							<tr>
								<th class="px-4 py-3">Titre</th>
								{#if !selectedQuestion}
									<th class="px-4 py-3">Catégorie / Section</th>
									<th class="px-4 py-3">Difficulté</th>
									<th class="px-4 py-3">Supports</th>
								{/if}
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-100">
							{#each data.rows as q}
								<tr
									class="cursor-pointer bg-white hover:bg-gray-50 {selectedQuestion?.id === q.id ? 'bg-blue-50 hover:bg-blue-50' : ''}"
									onclick={() => { selectedQuestion = q }}
								>
									<td class="px-4 py-3 font-medium text-gray-900 {selectedQuestion ? 'truncate max-w-[200px]' : ''}">{q.title}</td>
									{#if !selectedQuestion}
										<td class="px-4 py-3 text-gray-500">
											{q.categoryDisplayName}<span class="mx-1 text-gray-300">/</span>{q.sectionDisplayName}
										</td>
										<td class="px-4 py-3 text-gray-500">{q.difficulty}</td>
										<td class="px-4 py-3 text-gray-500">
											{q.applicableSupports.length === 0 ? 'tous' : q.applicableSupports.join(', ')}
										</td>
									{/if}
								</tr>
							{:else}
								<tr>
									<td colspan="4" class="px-4 py-8 text-center text-gray-400">Aucune question trouvée</td>
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
				<div class="hidden lg:block lg:flex-1 min-w-0">
					<div class="sticky top-4 rounded-lg border border-gray-200 bg-white p-5">
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
							onclose={() => { selectedQuestion = null }}
						/>
						<div class="mt-4 border-t border-gray-100 pt-3">
							{#if reportSuccessId === selectedQuestion!.id}
								<p class="text-xs text-green-600">Signalement envoyé, merci.</p>
							{:else}
								<button
									type="button"
									onclick={() => { reportQuestionId = selectedQuestion!.id; reportQuestionTitle = selectedQuestion!.title }}
									class="text-xs text-gray-400 hover:text-orange-500 transition-colors"
								>
									Signaler un problème
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Panneau de prévisualisation mobile (plein écran) -->
{#if selectedQuestion}
	<div class="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
			<h2 class="text-base font-semibold text-gray-900 truncate">{selectedQuestion.title}</h2>
			<button
				type="button"
				onclick={() => { selectedQuestion = null }}
				class="shrink-0 text-gray-400 hover:text-gray-700 ml-2"
				aria-label="Fermer"
			>✕ Fermer</button>
		</div>
		<div class="flex-1 overflow-y-auto p-4">
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
			<div class="mt-4 border-t border-gray-100 pt-3">
				{#if reportSuccessId === selectedQuestion.id}
					<p class="text-xs text-green-600">Signalement envoyé, merci.</p>
				{:else}
					<button
						type="button"
						onclick={() => { reportQuestionId = selectedQuestion!.id; reportQuestionTitle = selectedQuestion!.title }}
						class="text-xs text-gray-400 hover:text-orange-500 transition-colors"
					>
						Signaler un problème
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<ReportModal
	open={reportQuestionId !== null}
	questionId={reportQuestionId ?? 0}
	questionTitle={reportQuestionTitle}
	onclose={() => { reportQuestionId = null }}
	onsuccess={() => { reportSuccessId = reportQuestionId; reportQuestionId = null }}
/>
