<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { evaluationStore, replaceQuestion } from '$lib/stores/evaluation'
	import type { EvaluationSlot } from '$lib/domain/types'
	import { createMarkdownRenderer } from '$lib/markdown'

	const evaluation = $derived($evaluationStore)

	let showCorrection = $state(false)
	let hideCategoriesOnPrint = $state(false)
	let hideSectionsOnPrint = $state(false)
	let panelOpen = $state(false)
	let activeTab = $state<'structure' | 'impression'>('structure')
	let desktopTab = $state<'structure' | 'impression'>('structure')
	let redrawingId = $state<number | null>(null)
	let toastMessage = $state('')
	let toastVisible = $state(false)
	let toastTimer: ReturnType<typeof setTimeout> | null = null

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

	function renderMd(md: string, questionId: number, catSlug: string, secSlug: string): string {
		return createMarkdownRenderer(questionId, catSlug, secSlug, page.data.r2BaseUrl)(md)
	}

	const answerHeightStyle: Record<string, string> = {
		xs: 'height:2rem',
		sm: 'height:4rem',
		md: 'height:6rem',
		lg: 'height:10rem'
	}

	function showToast(msg: string) {
		if (toastTimer) clearTimeout(toastTimer)
		toastMessage = msg
		toastVisible = true
		toastTimer = setTimeout(() => (toastVisible = false), 4000)
	}

	async function redrawQuestion(slotId: number, questionId: number, sectionId: number) {
		if (!evaluation || redrawingId !== null) return
		redrawingId = questionId
		const slot = evaluation.slots.find((s) => s.slotId === slotId)!
		const excludeQuestionIds = slot.questions.map((q) => q.id)
		try {
			const res = await fetch('/api/evaluation/redraw-question', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sectionId, excludeQuestionIds, support: evaluation.support })
			})
			if (res.status === 422) {
				showToast('Aucune autre question disponible dans cette section')
			} else if (res.ok) {
				replaceQuestion(slotId, questionId, await res.json())
			} else {
				showToast('Erreur lors du re-tirage')
			}
		} catch {
			showToast('Erreur réseau')
		} finally {
			redrawingId = null
		}
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

{#if toastVisible}
	<div class="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg print:hidden">
		<span>{toastMessage}</span>
		<button onclick={() => (toastVisible = false)} class="text-gray-400 hover:text-white" aria-label="Fermer">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{/if}

{#if evaluation}
	<div class="flex min-h-screen print:block">

		<!-- Panel latéral desktop -->
		<aside class="hidden lg:flex w-56 shrink-0 border-r border-gray-200 sticky top-0 h-screen flex-col print:hidden">
			<!-- Onglets -->
			<div class="flex border-b border-gray-200 px-2">
				<button
					onclick={() => (desktopTab = 'structure')}
					class="flex-1 px-2 py-3 text-xs font-medium transition-colors border-b-2 {desktopTab === 'structure' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					Structure
				</button>
				<button
					onclick={() => (desktopTab = 'impression')}
					class="flex-1 px-2 py-3 text-xs font-medium transition-colors border-b-2 {desktopTab === 'impression' ? 'border-gray-800 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}"
				>
					Impression
				</button>
			</div>
			<!-- Contenu -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if desktopTab === 'structure'}
					{#each slotsByCategory.entries() as [categoryId, category]}
						<div class="mb-4">
							<a href="#cat-{categoryId}" class="mb-1 flex items-center justify-between text-sm font-bold text-gray-700 hover:text-gray-900">
								{category.name}
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
									<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
								</svg>
							</a>
							{#each category.slots as slot}
								<div class="flex items-center justify-between py-0.5 pl-2">
									<span class="text-sm text-gray-600 leading-snug">{slot.sectionDisplayName}</span>
									<span class="ml-2 shrink-0 text-xs text-gray-400">{slot.questions.length} q.</span>
								</div>
							{/each}
						</div>
					{/each}
				{:else}
					<div class="space-y-4">
						<label class="flex cursor-pointer items-center justify-between">
							<span class="text-sm text-gray-700">Masquer catégories</span>
							<input type="checkbox" bind:checked={hideCategoriesOnPrint} class="h-4 w-4" />
						</label>
						<label class="flex cursor-pointer items-center justify-between">
							<span class="text-sm text-gray-700">Masquer sections</span>
							<input type="checkbox" bind:checked={hideSectionsOnPrint} class="h-4 w-4" />
						</label>
						<button
							onclick={printEvaluation}
							class="mt-2 w-full rounded bg-gray-800 py-2.5 text-sm text-white hover:bg-gray-700"
						>
							Imprimer
						</button>
					</div>
				{/if}
			</div>
		</aside>

		<!-- Contenu principal -->
		<div class="flex-1 min-w-0">

			<!-- Top bar sticky mobile -->
			<div class="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 print:hidden">
				<button
					onclick={() => (panelOpen = true)}
					class="flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
					aria-label="Menu"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
					</svg>
				</button>
				<h1 class="flex-1 truncate text-base font-semibold capitalize">
					{evaluation.support} — {evaluation.format}
				</h1>
				<button
					onclick={() => (showCorrection = !showCorrection)}
					class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors {showCorrection ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}"
					aria-label="Afficher la correction"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span class="hidden sm:inline">Correction</span>
				</button>
			</div>

			<div class="mx-auto max-w-3xl px-4 py-10 print:px-0 print:py-0">

				<!-- Header desktop -->
				<header class="mb-8 hidden lg:flex items-center justify-between print:hidden">
					<h1 class="text-2xl font-bold capitalize">
						Évaluation {evaluation.support} — {evaluation.format}
					</h1>
					<button
						onclick={() => (showCorrection = !showCorrection)}
						class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors {showCorrection ? 'border-gray-800 bg-gray-800 text-white' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}"
						aria-label="Afficher la correction"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						Correction
					</button>
				</header>

				{#each evaluation.slots as slot, i}
					{@const prevSlot = i > 0 ? evaluation.slots[i - 1] : null}
					{@const newCategory = !prevSlot || prevSlot.categoryId !== slot.categoryId}

					{#if newCategory}
						<h2 id="cat-{slot.categoryId}" class="mt-10 mb-4 border-b-2 border-gray-800 pb-1 text-lg font-bold uppercase tracking-wide break-after-avoid print:mt-6 {hideCategoriesOnPrint ? 'print:hidden' : ''}">
							{slot.categoryDisplayName}
						</h2>
					{/if}

					<section class="mb-6 print:divide-y print:divide-gray-200">
						<h3 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide break-after-avoid print:mb-1 {hideSectionsOnPrint ? 'print:hidden' : ''}">
							{slot.sectionDisplayName}
						</h3>

						{#each slot.questions as question}
							<article class="relative mb-6 break-inside-avoid rounded-lg border border-gray-200 p-5 print:rounded-none print:border-0 print:p-3">
								<button
									onclick={() => redrawQuestion(slot.slotId, question.id, slot.sectionId)}
									disabled={redrawingId !== null}
									class="absolute -top-3 right-4 rounded-md border border-gray-200 bg-white p-1 text-gray-400 shadow-sm transition-colors hover:border-gray-400 hover:text-gray-700 disabled:opacity-40 print:hidden"
									aria-label="Re-tirer cette question"
									title="Re-tirer cette question"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 {redrawingId === question.id ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
								</button>
								<p class="mb-3 font-medium">{question.title}</p>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<div class="prose prose-sm max-w-none">{@html renderMd(question.questionMd, question.id, slot.categorySlug, slot.sectionSlug)}</div>
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
										<div class="prose prose-sm max-w-none">{@html renderMd(question.correctionMd, question.id, slot.categorySlug, slot.sectionSlug)}</div>
									</div>
								{/if}
							</article>
						{/each}
					</section>
				{/each}
			</div>
		</div>

		<!-- Drawer mobile avec onglets -->
		{#if panelOpen}
			<button
				class="lg:hidden fixed inset-0 z-40 bg-black/40 print:hidden"
				onclick={() => (panelOpen = false)}
				aria-label="Fermer"
			></button>
			<aside class="lg:hidden fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl print:hidden">
				<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
					<div class="flex gap-1">
						<button
							onclick={() => (activeTab = 'structure')}
							class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab === 'structure' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
						>
							Structure
						</button>
						<button
							onclick={() => (activeTab = 'impression')}
							class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {activeTab === 'impression' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
						>
							Impression
						</button>
					</div>
					<button onclick={() => (panelOpen = false)} class="text-gray-400 hover:text-gray-600" aria-label="Fermer">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="flex-1 overflow-y-auto p-4">
					{#if activeTab === 'structure'}
						{#each slotsByCategory.entries() as [categoryId, category]}
							<div class="mb-4">
								<a
									href="#cat-{categoryId}"
									onclick={() => (panelOpen = false)}
									class="mb-1 flex items-center justify-between text-sm font-bold text-gray-700 hover:text-gray-900"
								>
									{category.name}
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
									</svg>
								</a>
								{#each category.slots as slot}
									<div class="flex items-center justify-between py-0.5 pl-2">
										<span class="text-sm text-gray-600 leading-snug">{slot.sectionDisplayName}</span>
										<span class="ml-2 shrink-0 text-xs text-gray-400">{slot.questions.length} q.</span>
									</div>
								{/each}
							</div>
						{/each}
					{:else}
						<div class="space-y-4">
							<label class="flex cursor-pointer items-center justify-between">
								<span class="text-sm text-gray-700">Masquer catégories</span>
								<input type="checkbox" bind:checked={hideCategoriesOnPrint} class="h-4 w-4" />
							</label>
							<label class="flex cursor-pointer items-center justify-between">
								<span class="text-sm text-gray-700">Masquer sections</span>
								<input type="checkbox" bind:checked={hideSectionsOnPrint} class="h-4 w-4" />
							</label>
							<button
								onclick={printEvaluation}
								class="mt-2 w-full rounded bg-gray-800 py-2.5 text-sm text-white hover:bg-gray-700"
							>
								Imprimer
							</button>
						</div>
					{/if}
				</div>
			</aside>
		{/if}

	</div>
{/if}
