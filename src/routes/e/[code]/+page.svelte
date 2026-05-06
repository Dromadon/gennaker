<script lang="ts">
	import { page } from '$app/state'
	import type { PageData } from './$types'
	import type { SharedEvaluationSlotWithUnavailable } from './+page.server'
	import type { Question, QuestionPickRow } from '$lib/domain/types'
	import { createMarkdownRenderer } from '$lib/markdown'
	import QuestionPickerModal from '$lib/components/QuestionPickerModal.svelte'
	import ReportModal from '$lib/components/ReportModal.svelte'
	import ShareModal from '$lib/components/ShareModal.svelte'

	let { data }: { data: PageData } = $props()

	let showCorrection = $state(false)
	let hideCategoriesOnPrint = $state(false)
	let hideSectionsOnPrint = $state(false)
	let panelOpen = $state(false)
	let activeTab = $state<'structure' | 'impression'>('structure')
	let desktopTab = $state<'structure' | 'impression'>('structure')
	let redrawingSlotId = $state<number | null>(null)
	let managerSlot = $state<SharedEvaluationSlotWithUnavailable | null>(null)
	let reportQuestionId = $state<number | null>(null)
	let reportQuestionTitle = $state('')
	let toastMessage = $state('')
	let toastVisible = $state(false)
	let toastTimer: ReturnType<typeof setTimeout> | null = null
	let modificationWarningShown = $state(false)
	let modificationWarningOpen = $state(false)
	let modificationWarningCallback = $state<(() => void) | null>(null)
	let shareModalOpen = $state(false)
	let shareUrl = $state('')
	let sharing = $state(false)

	let slots = $state<SharedEvaluationSlotWithUnavailable[]>(
		data.expired ? [] : (data.slots as SharedEvaluationSlotWithUnavailable[])
	)

	const support = data.support
	const format = data.format

	const slotsByCategory = $derived(
		slots.reduce((acc, slot) => {
			if (!acc.has(slot.categoryId))
				acc.set(slot.categoryId, { name: slot.categoryDisplayName, slots: [] })
			acc.get(slot.categoryId)!.slots.push(slot)
			return acc
		}, new Map<number, { name: string; slots: SharedEvaluationSlotWithUnavailable[] }>())
	)

	function renderMd(md: string, questionId: number): string {
		return createMarkdownRenderer(questionId, page.data.r2BaseUrl)(md)
	}

	const answerHeightStyle: Record<string, string> = {
		xs: 'height:2rem',
		sm: 'height:4rem',
		md: 'height:6rem',
		lg: 'height:10rem',
		xl: 'height:14rem'
	}

	function showToast(msg: string) {
		if (toastTimer) clearTimeout(toastTimer)
		toastMessage = msg
		toastVisible = true
		toastTimer = setTimeout(() => (toastVisible = false), 4000)
	}

	function withModificationWarning(action: () => void) {
		if (modificationWarningShown) {
			action()
		} else {
			modificationWarningCallback = action
			modificationWarningOpen = true
		}
	}

	function confirmModification() {
		modificationWarningShown = true
		modificationWarningOpen = false
		modificationWarningCallback?.()
		modificationWarningCallback = null
	}

	function cancelModification() {
		modificationWarningOpen = false
		modificationWarningCallback = null
	}

	async function shareEvaluation() {
		if (sharing) return
		sharing = true
		try {
			const res = await fetch('/api/evaluation/share', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ support, format, slots })
			})
			if (!res.ok) { showToast('Erreur lors du partage'); return }
			const { url } = await res.json() as { url: string }
			shareUrl = url
			shareModalOpen = true
		} catch {
			showToast('Erreur réseau')
		} finally {
			sharing = false
		}
	}

	async function redrawSection(slot: SharedEvaluationSlotWithUnavailable) {
		if (redrawingSlotId !== null) return
		redrawingSlotId = slot.slotId
		const drawn: Question[] = []
		for (const q of slot.questions) {
			const excludeIds = [...slot.questions.map((x) => x.id), ...drawn.map((x) => x.id)]
			try {
				const res = await fetch('/api/evaluation/redraw-question', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sectionId: slot.sectionId, excludeQuestionIds: excludeIds, support })
				})
				if (res.ok) {
					drawn.push(await res.json())
				} else {
					drawn.push(q)
				}
			} catch {
				drawn.push(q)
			}
		}
		slots = slots.map((s) =>
			s.slotId === slot.slotId ? { ...s, questions: drawn, unavailableCount: 0 } : s
		)
		showToast('Section re-tirée')
		redrawingSlotId = null
	}

	function handleManage(selected: QuestionPickRow[]) {
		if (!managerSlot) return
		const sectionId = managerSlot.sectionId
		const slotId = managerSlot.slotId
		const newQuestions: Question[] = selected.map((c) => ({
			id: c.id,
			sectionId,
			title: c.title,
			questionMd: c.questionMd,
			correctionMd: c.correctionMd,
			applicableSupports: c.applicableSupports,
			answerSize: c.answerSize
		}))
		slots = slots.map((s) =>
			s.slotId === slotId ? { ...s, questions: newQuestions, unavailableCount: 0 } : s
		)
		showToast(newQuestions.length === 0 ? 'Section désactivée' : 'Section mise à jour')
		managerSlot = null
	}

	function printEvaluation() {
		const date = new Date().toISOString().slice(0, 10)
		const prev = document.title
		document.title = `Evaluation-${support}-${format}-${date}`
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

{#if data.expired}
	<div class="flex min-h-screen items-center justify-center px-4">
		<div class="text-center">
			<p class="mb-4 text-lg font-semibold text-gray-800">Ce lien a expiré</p>
			<p class="mb-6 text-sm text-gray-500">Générez une nouvelle évaluation depuis la page d'accueil.</p>
			<a href="/" class="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
				Retour à l'accueil
			</a>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen print:block">

		<!-- Panel latéral desktop (droite) -->
		<aside class="hidden lg:flex w-56 shrink-0 border-l border-gray-200 sticky top-0 h-screen flex-col order-last print:hidden">
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
									<span class="text-sm leading-snug {slot.questions.length === 0 ? 'text-gray-300 italic' : 'text-gray-600'}">{slot.sectionDisplayName}{slot.questions.length === 0 ? ' (désactivée)' : ''}</span>
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
			<div class="lg:hidden sticky top-0 z-30 flex items-center gap-1 border-b border-gray-200 bg-white px-2 py-2 print:hidden">
				<a
					href="/"
					class="flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 shrink-0"
					aria-label="Accueil Gennaker"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
					</svg>
				</a>
				<h1 class="flex-1 min-w-0 truncate text-base font-semibold capitalize px-1">
					{support} — {format}
				</h1>
				<button
					onclick={() => (showCorrection = !showCorrection)}
					class="flex items-center justify-center rounded-md p-1.5 transition-colors {showCorrection ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'}"
					aria-label="Afficher la correction"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</button>
				<button
					onclick={shareEvaluation}
					disabled={sharing}
					class="flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
					aria-label="Partager"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
					</svg>
				</button>
				<button
					onclick={() => (panelOpen = true)}
					class="flex items-center justify-center rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
					aria-label="Menu"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h7" />
					</svg>
				</button>
			</div>

			<div class="mx-auto max-w-3xl px-4 py-10 print:px-0 print:py-0">

				<!-- Header desktop -->
				<header class="mb-8 hidden lg:flex items-center justify-between print:hidden">
					<h1 class="text-2xl font-bold capitalize">
						Évaluation {support} — {format}
					</h1>
					<div class="flex items-center gap-2">
						<button
							onclick={shareEvaluation}
							disabled={sharing}
							class="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
							aria-label="Partager"
							title="Partager cette évaluation"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
							</svg>
							Partager
						</button>
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
					</div>
				</header>

				{#each slots as slot, i}
					{@const prevSlot = i > 0 ? slots[i - 1] : null}
					{@const newCategory = !prevSlot || prevSlot.categoryId !== slot.categoryId}

					{#if newCategory}
						<h2 id="cat-{slot.categoryId}" class="mt-10 mb-4 border-b-2 border-gray-800 pb-1 text-lg font-bold uppercase tracking-wide break-after-avoid print:mt-6 {hideCategoriesOnPrint ? 'print:hidden' : ''}">
							{slot.categoryDisplayName}
						</h2>
					{/if}

					<section class="mb-6 print:divide-y print:divide-gray-200 {slot.questions.length === 0 && slot.unavailableCount === 0 ? 'print:hidden' : ''}">
						<div class="mb-2 flex items-center justify-between break-after-avoid {hideSectionsOnPrint ? 'print:hidden' : ''}">
							<h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">
								{slot.sectionDisplayName}
							</h3>
							<div class="print:hidden flex items-center gap-1">
								<button
									onclick={() => withModificationWarning(() => (managerSlot = slot))}
									disabled={redrawingSlotId !== null || managerSlot !== null}
									class="flex items-center gap-1 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600 disabled:opacity-40"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
									</svg>
									Choisir
								</button>
								<button
									onclick={() => withModificationWarning(() => redrawSection(slot))}
									disabled={redrawingSlotId !== null || managerSlot !== null}
									class="flex items-center justify-center rounded border border-gray-200 bg-white p-0.5 text-gray-400 transition-colors hover:border-gray-400 hover:text-gray-600 disabled:opacity-40"
									aria-label="Re-tirer toutes les questions de cette section"
									title="Re-tirer toutes les questions"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 {redrawingSlotId === slot.slotId ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
									</svg>
								</button>
							</div>
						</div>

						{#if slot.unavailableCount > 0}
							<p class="mb-3 rounded-lg border border-dashed border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 print:hidden">
								{slot.unavailableCount} question{slot.unavailableCount > 1 ? 's' : ''} indisponible{slot.unavailableCount > 1 ? 's' : ''} — re-tirez ou sélectionnez une question manuellement
							</p>
						{/if}

						{#if slot.questions.length === 0 && slot.unavailableCount === 0}
							<p class="mb-6 rounded-lg border border-dashed border-gray-200 px-5 py-4 text-sm text-gray-400 italic print:hidden">
								Section désactivée — aucune question
							</p>
						{:else}
							{#each slot.questions as question}
							<article class="relative mb-4 break-inside-avoid rounded-lg border border-gray-200 px-4 py-3 print:rounded-none print:border-0 print:p-3">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<div class="prose prose-sm max-w-none">{@html renderMd(question.questionMd, question.id)}</div>
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
										<div class="prose prose-sm max-w-none">{@html renderMd(question.correctionMd, question.id)}</div>
									</div>
								{/if}
								<div class="mt-3 flex justify-end print:hidden">
									<button
										onclick={() => { reportQuestionId = question.id; reportQuestionTitle = question.title }}
										class="text-xs text-gray-300 transition-colors hover:text-orange-400"
									>
										Signaler un problème
									</button>
								</div>
							</article>
							{/each}
						{/if}
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
			<aside class="lg:hidden fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-white shadow-xl print:hidden">
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
										<span class="text-sm leading-snug {slot.questions.length === 0 ? 'text-gray-300 italic' : 'text-gray-600'}">{slot.sectionDisplayName}{slot.questions.length === 0 ? ' (désactivée)' : ''}</span>
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

	{#if managerSlot}
		<QuestionPickerModal
			open={true}
			slot={managerSlot}
			support={support}
			selectedIds={managerSlot.questions.map((q) => q.id)}
			onapply={handleManage}
			onclose={() => (managerSlot = null)}
		/>
	{/if}
	<ReportModal
		open={reportQuestionId !== null}
		questionId={reportQuestionId ?? 0}
		questionTitle={reportQuestionTitle}
		onclose={() => { reportQuestionId = null }}
		onsuccess={() => showToast('Signalement envoyé, merci')}
	/>
	<ShareModal
		open={shareModalOpen}
		url={shareUrl}
		onclose={() => (shareModalOpen = false)}
	/>
{/if}

{#if modificationWarningOpen}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<dialog
		open
		class="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg p-0 shadow-xl backdrop:bg-black/40"
		onkeydown={(e) => e.key === 'Escape' && cancelModification()}
	>
		<div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
			<h2 class="text-base font-semibold text-gray-900">Modifier cette évaluation ?</h2>
			<button onclick={cancelModification} class="rounded-md p-1 text-gray-400 hover:text-gray-700" aria-label="Fermer">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
		<div class="px-5 py-4">
			<p class="text-sm text-gray-600">
				Vous consultez une évaluation partagée. Vos modifications (re-tirages, sélections manuelles) sont <strong>locales</strong> et n'altèrent pas le lien original.
			</p>
			<p class="mt-2 text-sm text-gray-600">
				Pour enregistrer vos modifications, utilisez le bouton <strong>Partager</strong> pour générer un nouveau lien.
			</p>
		</div>
		<div class="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
			<button
				onclick={cancelModification}
				class="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900"
			>
				Annuler
			</button>
			<button
				onclick={confirmModification}
				class="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
			>
				Continuer
			</button>
		</div>
	</dialog>
	<div class="fixed inset-0 z-40 bg-black/40" role="presentation"></div>
{/if}
