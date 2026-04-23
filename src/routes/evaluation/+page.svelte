<script lang="ts">
	import { goto } from '$app/navigation'
	import { evaluationStore } from '$lib/stores/evaluation'
	import type { EvaluationSlot } from '$lib/domain/types'
	import { marked } from 'marked'

	const evaluation = $derived($evaluationStore)

	let showCorrection = $state(false)
	let hideCategoriesOnPrint = $state(false)
	let hideSectionsOnPrint = $state(false)
	let panelOpen = $state(false)

	$effect(() => {
		if (!evaluation) goto('/')
	})

	const slotsByCategory = $derived(
		evaluation
			? evaluation.slots.reduce((acc, slot) => {
					if (!acc.has(slot.categoryId))
						acc.set(slot.categoryId, { name: slot.categoryDisplayName, slots: [] })
					acc.get(slot.categoryId)!.slots.push(slot)
					return acc
				}, new Map<number, { name: string; slots: EvaluationSlot[] }>())
			: new Map<number, { name: string; slots: EvaluationSlot[] }>()
	)

	function renderMd(md: string): string {
		return marked(md) as string
	}

	const answerHeightStyle: Record<string, string> = {
		xs: 'height:2rem',
		sm: 'height:4rem',
		md: 'height:6rem',
		lg: 'height:10rem'
	}

	function printEvaluation() {
		if (!evaluation) return
		const date = new Date().toISOString().slice(0, 10)
		const prev = document.title
		document.title = `Evaluation-${evaluation.support}-${evaluation.format}-${date}`
		window.addEventListener('afterprint', () => { document.title = prev }, { once: true })
		window.print()
	}
</script>

{#if evaluation}
	<div class="flex min-h-screen print:block">

		<!-- Panel latéral desktop -->
		<aside class="hidden lg:block w-56 shrink-0 border-r border-gray-200 sticky top-0 h-screen overflow-y-auto p-4 print:hidden">
			<p class="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">Structure</p>
			{#each slotsByCategory.values() as category}
				<div class="mb-4">
					<p class="mb-1 text-sm font-bold text-gray-700">{category.name}</p>
					{#each category.slots as slot}
						<div class="flex items-center justify-between py-0.5 pl-2">
							<span class="text-sm text-gray-600 leading-snug">{slot.sectionDisplayName}</span>
							<span class="ml-2 shrink-0 text-xs text-gray-400">{slot.questions.length} q.</span>
						</div>
					{/each}
				</div>
			{/each}
		</aside>

		<!-- Contenu principal -->
		<div class="flex-1 min-w-0">
			<div class="mx-auto max-w-3xl px-4 py-10 print:px-0 print:py-0">
				<header class="mb-8 print:hidden">
					<h1 class="mb-4 text-2xl font-bold capitalize">
						Évaluation {evaluation.support} — {evaluation.format}
					</h1>
					<div class="flex flex-wrap items-center justify-between gap-4">
						<label class="flex cursor-pointer items-center gap-2 text-sm">
							<input type="checkbox" bind:checked={showCorrection} class="h-4 w-4" />
							Afficher la correction
						</label>
						<div class="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
							<span class="text-xs font-semibold uppercase tracking-wide text-gray-400">Impression</span>
							<label class="flex cursor-pointer items-center gap-2 text-sm">
								<input type="checkbox" bind:checked={hideCategoriesOnPrint} class="h-4 w-4" />
								Masquer catégories
							</label>
							<label class="flex cursor-pointer items-center gap-2 text-sm">
								<input type="checkbox" bind:checked={hideSectionsOnPrint} class="h-4 w-4" />
								Masquer sections
							</label>
							<button
								onclick={printEvaluation}
								class="rounded bg-gray-800 px-4 py-1 text-sm text-white hover:bg-gray-700"
							>
								Imprimer
							</button>
						</div>
					</div>
				</header>

				{#each evaluation.slots as slot, i}
					{@const prevSlot = i > 0 ? evaluation.slots[i - 1] : null}
					{@const newCategory = !prevSlot || prevSlot.categoryId !== slot.categoryId}

					{#if newCategory}
						<h2 class="mt-10 mb-4 border-b-2 border-gray-800 pb-1 text-lg font-bold uppercase tracking-wide break-after-avoid print:mt-6 {hideCategoriesOnPrint ? 'print:hidden' : ''}">
							{slot.categoryDisplayName}
						</h2>
					{/if}

					<section class="mb-6 print:divide-y print:divide-gray-200">
						<h3 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide break-after-avoid print:mb-1 {hideSectionsOnPrint ? 'print:hidden' : ''}">
							{slot.sectionDisplayName}
						</h3>

						{#each slot.questions as question}
							<article class="mb-6 break-inside-avoid rounded-lg border border-gray-200 p-5 print:rounded-none print:border-0 print:p-3">
								<p class="mb-3 font-medium">{question.title}</p>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<div class="prose prose-sm max-w-none">{@html renderMd(question.questionMd)}</div>
								{#if !showCorrection}
									<div
										class="hidden print:block"
										style={answerHeightStyle[question.answerSize] ?? answerHeightStyle.md}
									></div>
								{/if}
								{#if showCorrection && question.correctionMd}
									<div class="mt-4 border-t border-gray-200 pt-4">
										<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Correction</p>
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										<div class="prose prose-sm max-w-none">{@html renderMd(question.correctionMd)}</div>
									</div>
								{/if}
							</article>
						{/each}
					</section>
				{/each}
			</div>
		</div>

		<!-- Bouton flottant mobile -->
		<button
			onclick={() => (panelOpen = true)}
			class="lg:hidden fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800 text-white shadow-lg print:hidden"
			aria-label="Voir la structure"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
			</svg>
		</button>

		<!-- Drawer mobile -->
		{#if panelOpen}
			<!-- Overlay -->
			<button
				class="lg:hidden fixed inset-0 z-40 bg-black/40 print:hidden"
				onclick={() => (panelOpen = false)}
				aria-label="Fermer"
			></button>
			<!-- Panneau -->
			<aside class="lg:hidden fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-white p-4 shadow-xl print:hidden">
				<div class="mb-4 flex items-center justify-between">
					<p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Structure</p>
					<button onclick={() => (panelOpen = false)} class="text-gray-400 hover:text-gray-600" aria-label="Fermer">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				{#each slotsByCategory.values() as category}
					<div class="mb-4">
						<p class="mb-1 text-sm font-bold text-gray-700">{category.name}</p>
						{#each category.slots as slot}
							<div class="flex items-center justify-between py-0.5 pl-2">
								<span class="text-sm text-gray-600 leading-snug">{slot.sectionDisplayName}</span>
								<span class="ml-2 shrink-0 text-xs text-gray-400">{slot.questions.length} q.</span>
							</div>
						{/each}
					</div>
				{/each}
			</aside>
		{/if}

	</div>
{/if}
