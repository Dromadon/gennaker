<script lang="ts">
	import type { EvaluationSlot, QuestionPickRow, Support } from '$lib/domain/types'

	type Props = {
		open: boolean
		slot: EvaluationSlot
		support: Support
		currentQuestionIds: number[]
		onpick: (question: QuestionPickRow) => void
		onclose: () => void
	}

	let { open, slot, support, currentQuestionIds, onpick, onclose }: Props = $props()

	let dialog = $state<HTMLDialogElement | null>(null)
	let search = $state('')
	let candidates = $state<QuestionPickRow[]>([])
	let loading = $state(false)
	let debounceTimer: ReturnType<typeof setTimeout> | null = null

	$effect(() => {
		if (open) {
			dialog?.showModal()
			search = ''
			fetchCandidates('')
		} else {
			dialog?.close()
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

	function handlePick(candidate: QuestionPickRow) {
		onpick(candidate)
		onclose()
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialog) onclose()
	}

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
	<div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
		<div>
			<h2 class="text-base font-semibold text-gray-900">Choisir une question</h2>
			<p class="text-xs text-gray-500 mt-0.5">{slot.sectionDisplayName}</p>
		</div>
		<button
			onclick={onclose}
			class="rounded-md p-1 text-gray-400 hover:text-gray-700"
			aria-label="Fermer"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Recherche -->
	<div class="px-5 py-3 border-b border-gray-100">
		<input
			type="text"
			bind:value={search}
			oninput={onSearchInput}
			placeholder="Rechercher par titre…"
			class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			autofocus
		/>
	</div>

	<!-- Liste des candidats -->
	<div class="overflow-y-auto flex-1">
		{#if loading}
			<p class="px-5 py-8 text-center text-sm text-gray-400">Chargement…</p>
		{:else if candidates.length === 0}
			<p class="px-5 py-8 text-center text-sm text-gray-400">Aucune question disponible.</p>
		{:else}
			<ul>
				{#each candidates as candidate}
					{@const alreadyUsed = currentQuestionIds.includes(candidate.id)}
					<li>
						<button
							onclick={() => handlePick(candidate)}
							class="w-full text-left px-5 py-3 border-b border-gray-100 transition-colors flex items-start justify-between gap-3 {alreadyUsed ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}"
						>
							<span class="flex shrink-0 items-start pt-0.5 w-4">
								{#if alreadyUsed}
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
									</svg>
								{/if}
							</span>
							<span class="flex-1 text-sm {alreadyUsed ? 'text-blue-900 font-medium' : 'text-gray-900'}">
								{candidate.title}
							</span>
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
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</dialog>
