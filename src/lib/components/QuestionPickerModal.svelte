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
	// Animation de transition : la question reste visible le temps du slide-out avant que localSelected change.
	// leavingIds est un Set (pas un scalaire) car lu dans $derived(available) — exitingId est un scalaire
	// car il ne sert qu'à piloter une classe CSS, sans impact sur le filtre.
	// Le backgroundColor appliqué en style inline n'est jamais nettoyé : le nœud est détruit à la fin de l'animation.
	let leavingIds = $state<Set<number>>(new Set())
	let exitingId = $state<number | null>(null)
	let justAddedId = $state<number | null>(null)
	let justReturnedId = $state<number | null>(null)
	let sortOrder = $state<'asc' | 'desc'>('asc')

	const ANIM_DURATION = 300
	const DEBOUNCE_MS = 300

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
			const map = new Map<number, QuestionPickRow>()
			for (const id of selectedIds) {
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
		debounceTimer = setTimeout(() => fetchCandidates(search), DEBOUNCE_MS)
	}

	function addQuestion(candidate: QuestionPickRow, el: HTMLElement) {
		el.style.backgroundColor = '#eff6ff'
		leavingIds = new Set(leavingIds).add(candidate.id)
		setTimeout(() => {
			leavingIds.delete(candidate.id)
			leavingIds = new Set(leavingIds)
			localSelected = new Map(localSelected).set(candidate.id, candidate)
			justAddedId = candidate.id
			setTimeout(() => (justAddedId = null), ANIM_DURATION)
		}, ANIM_DURATION)
	}

	function removeQuestion(id: number, el: HTMLElement) {
		el.style.backgroundColor = '#fef2f2'
		exitingId = id
		setTimeout(() => {
			const next = new Map(localSelected)
			next.delete(id)
			localSelected = next
			exitingId = null
			justReturnedId = id
			setTimeout(() => (justReturnedId = null), ANIM_DURATION)
		}, ANIM_DURATION)
	}

	function handleApply() {
		onapply(Array.from(localSelected.values()))
		onclose()
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialog) onclose()
	}

	function toggleSort() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'
	}

	function difficultyValue(difficulty: 'facile' | 'moyen' | 'difficile'): number {
		return difficulty === 'facile' ? 1 : difficulty === 'moyen' ? 2 : 3
	}

	const available = $derived(
		candidates
			.filter((c) => !localSelected.has(c.id) || leavingIds.has(c.id))
			.sort((a, b) => {
				const diff = difficultyValue(a.difficulty) - difficultyValue(b.difficulty)
				return sortOrder === 'asc' ? diff : -diff
			})
	)

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
						onclick={(e) => removeQuestion(q.id, e.currentTarget)}
						class="group w-full text-left flex items-center border-b border-gray-100 transition-colors hover:bg-red-50 {justAddedId === q.id ? 'animate-slide-in' : ''} {exitingId === q.id ? 'animate-slide-out' : ''}"
						aria-label="Retirer {q.title}"
					>
						<span class="flex w-8 shrink-0 items-center justify-center self-stretch touch-icon text-transparent transition-colors group-hover:text-red-400">
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
			<button
				onclick={toggleSort}
				class="shrink-0 flex items-center gap-1.5 rounded px-2 py-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
				aria-label="Trier par difficulté {sortOrder === 'asc' ? 'décroissante' : 'croissante'}"
				title="Trier par difficulté"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
				</svg>
				<span class="text-xs font-medium">{sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}</span>
			</button>
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
							onclick={(e) => addQuestion(candidate, e.currentTarget)}
							class="group w-full text-left flex items-center border-b border-gray-100 transition-colors hover:bg-blue-50 {leavingIds.has(candidate.id) ? 'animate-slide-out pointer-events-none' : ''} {justReturnedId === candidate.id ? 'animate-slide-in pointer-events-none' : ''}"
							aria-label="Ajouter {candidate.title}"
						>
							<span class="flex w-8 shrink-0 items-center justify-center self-stretch touch-icon text-transparent transition-colors group-hover:text-blue-400">
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
	.animate-slide-in { animation: slide-in 0.3s ease-out; }

	@keyframes slide-out {
		from { opacity: 1; transform: translateY(0); }
		to   { opacity: 0; transform: translateY(-6px); }
	}
	.animate-slide-out { animation: slide-out 0.3s ease-in forwards; }

	@media (hover: none) {
		.touch-icon { color: #d1d5db; }
	}
</style>
