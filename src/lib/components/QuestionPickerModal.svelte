<script lang="ts">
	import type { EvaluationSlot, QuestionPickRow, Support } from '$lib/domain/types'

	type Props = {
		open: boolean
		slot: EvaluationSlot
		support: Support
		selectedIds: number[]
		onapply: (selected: QuestionPickRow[]) => void
		onclose: () => void
	}

	let { open, slot, support, selectedIds, onapply, onclose }: Props = $props()

	let dialog = $state<HTMLDialogElement | null>(null)
	let search = $state('')
	let candidates = $state<QuestionPickRow[]>([])
	let loading = $state(false)
	let debounceTimer: ReturnType<typeof setTimeout> | null = null
	let localSelected = $state<Map<number, QuestionPickRow>>(new Map())
	let justAddedId = $state<number | null>(null)

	$effect(() => {
		if (open) {
			dialog?.showModal()
			search = ''
			localSelected = new Map()
			fetchCandidates('')
		} else {
			dialog?.close()
		}
	})

	$effect(() => {
		if (candidates.length > 0 && open) {
			const ids = selectedIds
			const map = new Map<number, QuestionPickRow>()
			for (const id of ids) {
				const found = candidates.find((c) => c.id === id)
				if (found) map.set(id, found)
			}
			localSelected = map
		}
	})

	async function fetchCandidates(searchTerm: string) {
		loading = true
		try {
			const res = await fetch('/api/evaluation/question-candidates', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sectionId: slot.sectionId, support, search: searchTerm || undefined })
			})
			if (res.ok) candidates = await res.json()
		} finally {
			loading = false
		}
	}

	function onSearchInput() {
		if (debounceTimer) clearTimeout(debounceTimer)
		debounceTimer = setTimeout(() => fetchCandidates(search), 300)
	}

	function addQuestion(candidate: QuestionPickRow) {
		localSelected = new Map(localSelected).set(candidate.id, candidate)
		justAddedId = candidate.id
		setTimeout(() => (justAddedId = null), 600)
	}

	function removeQuestion(id: number) {
		const next = new Map(localSelected)
		next.delete(id)
		localSelected = next
	}

	function handleApply() {
		onapply(Array.from(localSelected.values()))
		onclose()
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialog) onclose()
	}

	const available = $derived(candidates.filter((c) => !localSelected.has(c.id)))

	const supportLabels: Record<string, string> = {
		deriveur: 'DÉR',
		catamaran: 'CAT',
		windsurf: 'WIN',
		croisiere: 'CRO'
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onclose()}
	class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl rounded-lg p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
	style="max-height: 80vh"
>
	<!-- En-tête -->
	<div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 shrink-0">
		<div>
			<p class="text-xs font-medium text-gray-400 uppercase tracking-wide">{slot.categoryDisplayName}</p>
			<h2 class="text-base font-semibold text-gray-900 mt-0.5">
				{slot.sectionDisplayName}
				<span class="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium text-gray-500">{localSelected.size}</span>
			</h2>
		</div>
		<button onclick={onclose} class="rounded-md p-1 text-gray-400 hover:text-gray-700" aria-label="Fermer">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Questions actives (fixe, ne scrolle pas) -->
	<div class="shrink-0 border-b border-gray-200">
		<div class="flex items-center gap-2 px-5 py-2 bg-gray-50 border-b border-gray-100">
			<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Questions actives</span>
			<span class="rounded-full bg-white border border-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-500">{localSelected.size}</span>
		</div>
		{#if localSelected.size > 0}
			<ul>
				{#each localSelected.values() as q (q.id)}
					<button
						onclick={() => removeQuestion(q.id)}
						class="group w-full text-left flex items-center border-b border-gray-100 transition-colors hover:bg-red-50 {justAddedId === q.id ? 'animate-slide-in' : ''}"
						aria-label="Retirer {q.title}"
					>
						<span class="flex w-8 shrink-0 items-center justify-center self-stretch text-transparent transition-colors group-hover:text-red-400">
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M20 12H4" />
							</svg>
						</span>
						<span class="flex flex-1 items-start justify-between gap-3 py-2.5 pr-4">
							<span class="flex-1 text-sm font-medium text-gray-900">{q.title}</span>
							<span class="shrink-0 flex items-center gap-1.5 mt-0.5">
								<span class="rounded px-1.5 py-0.5 text-xs font-medium {q.difficulty === 'facile' ? 'bg-green-100 text-green-700' : q.difficulty === 'difficile' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}">
									{q.difficulty}
								</span>
								{#if q.applicableSupports.length > 0}
									{#each q.applicableSupports as sup}
										<span class="rounded bg-blue-100 px-1 py-0.5 text-xs font-medium text-blue-700">{supportLabels[sup] ?? sup}</span>
									{/each}
								{/if}
							</span>
						</span>
					</button>
				{/each}
			</ul>
		{:else}
			<p class="px-5 py-3 text-sm text-gray-400 italic">Aucune question — la section sera désactivée.</p>
		{/if}
	</div>

	<!-- Questions disponibles (scrollable) -->
	<div class="flex flex-col flex-1 min-h-0">
		<div class="shrink-0 flex items-center gap-3 px-5 py-2 bg-gray-50 border-b border-gray-100">
			<span class="text-xs font-semibold uppercase tracking-wide text-gray-500 shrink-0">Ajouter</span>
			<input
				type="text"
				bind:value={search}
				oninput={onSearchInput}
				placeholder="Rechercher…"
				class="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-400 focus:outline-none"
			/>
		</div>
		<div class="overflow-y-auto flex-1">
			{#if loading}
				<p class="px-5 py-8 text-center text-sm text-gray-400">Chargement…</p>
			{:else if available.length === 0}
				<p class="px-5 py-4 text-center text-sm text-gray-400">
					{candidates.length === 0 ? 'Aucune question disponible.' : 'Toutes les questions sont sélectionnées.'}
				</p>
			{:else}
				<ul>
					{#each available as candidate (candidate.id)}
						<button
							onclick={() => addQuestion(candidate)}
							class="group w-full text-left flex items-center border-b border-gray-100 transition-colors hover:bg-blue-50"
							aria-label="Ajouter {candidate.title}"
						>
							<span class="flex w-8 shrink-0 items-center justify-center self-stretch text-transparent transition-colors group-hover:text-blue-400">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
								</svg>
							</span>
							<span class="flex flex-1 items-start justify-between gap-3 py-2.5 pr-4">
								<span class="flex-1 text-sm text-gray-700">{candidate.title}</span>
								<span class="shrink-0 flex items-center gap-1.5 mt-0.5">
									<span class="rounded px-1.5 py-0.5 text-xs font-medium {candidate.difficulty === 'facile' ? 'bg-green-100 text-green-700' : candidate.difficulty === 'difficile' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}">
										{candidate.difficulty}
									</span>
									{#if candidate.applicableSupports.length > 0}
										{#each candidate.applicableSupports as sup}
											<span class="rounded bg-blue-100 px-1 py-0.5 text-xs font-medium text-blue-700">{supportLabels[sup] ?? sup}</span>
										{/each}
									{/if}
								</span>
							</span>
						</button>
					{/each}
				</ul>
			{/if}
		</div>
	</div>

	<!-- Pied -->
	<div class="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 shrink-0">
		<button onclick={onclose} class="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
			Annuler
		</button>
		<button onclick={handleApply} class="rounded-md bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700">
			Appliquer
		</button>
	</div>
</dialog>

<style>
	@keyframes slide-in {
		from { opacity: 0; transform: translateY(-6px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	.animate-slide-in { animation: slide-in 0.25s ease-out; }
</style>
