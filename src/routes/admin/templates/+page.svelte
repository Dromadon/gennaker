<script lang="ts">
	import { enhance } from '$app/forms'
	import type { PageData, ActionData } from './$types'
	import type { TemplateSlotWithResolved, TemplateWithSlots } from '$lib/server/db/queries/templates'
	import QuestionPickerModal from '$lib/components/QuestionPickerModal.svelte'
	import type { EvaluationSlot, Support } from '$lib/domain/types'

	let { data, form }: { data: PageData; form: ActionData } = $props()

	const SUPPORT_LABELS: Record<string, string> = {
		deriveur: 'Dériveur',
		catamaran: 'Catamaran',
		windsurf: 'Windsurf',
		croisiere: 'Croisière'
	}

	const FORMAT_LABELS: Record<string, string> = {
		standard: 'Standard',
		raccourcie: 'Raccourcie',
		positionnement: 'Positionnement'
	}

	const supportOrder = ['deriveur', 'catamaran', 'windsurf', 'croisiere']
	const formatOrder = ['standard', 'raccourcie', 'positionnement']

	const availableSupports = supportOrder.filter((s) => data.templates.some((t) => t.supportSlug === s))
	const availableFormats = formatOrder.filter((f) => data.templates.some((t) => t.format === f))

	let selectedSupport = $state(availableSupports[0] ?? '')
	let selectedFormat = $state(availableFormats[0] ?? '')

	const currentTemplate = $derived(
		data.templates.find((t) => t.supportSlug === selectedSupport && t.format === selectedFormat) ?? null
	)

	// Slots groupés par catégorie pour l'affichage
	const slotsByCategory = $derived(() => {
		if (!currentTemplate) return []
		const map = new Map<string, { categoryDisplayName: string; slots: TemplateSlotWithResolved[] }>()
		for (const slot of currentTemplate.slots) {
			const key = slot.categorySlug
			if (!map.has(key)) map.set(key, { categoryDisplayName: slot.categoryDisplayName, slots: [] })
			map.get(key)!.slots.push(slot)
		}
		return [...map.values()]
	})

	let selectedSlot = $state<TemplateSlotWithResolved | null>(null)

	let pickerOpen = $state(false)
	let pickerMode = $state<'pinned' | 'preferred'>('pinned')

	function selectSlot(slot: TemplateSlotWithResolved) {
		selectedSlot = slot
	}

	function closePanel() {
		selectedSlot = null
	}

	function openPinned() {
		pickerMode = 'pinned'
		pickerOpen = true
	}

	function openPreferred() {
		pickerMode = 'preferred'
		pickerOpen = true
	}

	// Construit un EvaluationSlot factice pour QuestionPickerModal
	const pickerSlot = $derived((): EvaluationSlot | null => {
		if (!selectedSlot) return null
		return {
			slotId: selectedSlot.id,
			sectionId: selectedSlot.sectionId,
			categoryId: selectedSlot.categoryId,
			sectionDisplayName: selectedSlot.sectionDisplayName,
			categoryDisplayName: selectedSlot.categoryDisplayName,
			categorySlug: selectedSlot.categorySlug,
			sectionSlug: selectedSlot.sectionSlug,
			questions: []
		}
	})

	const pickerSupport = $derived((): Support => (currentTemplate?.supportSlug ?? 'deriveur') as Support)

	const pickerSelectedIds = $derived((): number[] => {
		if (!selectedSlot) return []
		if (pickerMode === 'pinned') return selectedSlot.pinnedQuestionId !== null ? [selectedSlot.pinnedQuestionId] : []
		return selectedSlot.preferredQuestionIds
	})

	let setPinnedForm: HTMLFormElement
	let setPreferredForm: HTMLFormElement
	let setPinnedQuestionIdInput: HTMLInputElement
	let setPreferredQuestionIdsInput: HTMLInputElement

	// Après soumission réussie, resynchronise selectedSlot depuis data rechargée par use:enhance
	function resyncSelectedSlot() {
		if (!selectedSlot) return
		const slotId = selectedSlot.id
		for (const t of data.templates) {
			const found = t.slots.find((s) => s.id === slotId)
			if (found) { selectedSlot = found; return }
		}
	}

	function handlePickerApply(selected: { id: number }[]) {
		pickerOpen = false
		if (!selectedSlot) return
		if (pickerMode === 'pinned') {
			setPinnedQuestionIdInput.value = selected.length > 0 ? String(selected[0].id) : ''
			setPinnedForm.requestSubmit()
		} else {
			setPreferredQuestionIdsInput.value = JSON.stringify(selected.map((q) => q.id))
			setPreferredForm.requestSubmit()
		}
	}
</script>

<div class="mb-6">
	<h1 class="text-xl font-semibold text-gray-900">Templates d'évaluation</h1>
</div>

<!-- Sélecteur support -->
<fieldset class="mb-4">
	<legend class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Support</legend>
	<div class="flex flex-wrap gap-2">
		{#each availableSupports as s}
			<label class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors {selectedSupport === s ? 'border-blue-600 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 hover:border-gray-400'}">
				<input type="radio" bind:group={selectedSupport} value={s} class="sr-only" onchange={() => { selectedSlot = null }} />
				{SUPPORT_LABELS[s] ?? s}
			</label>
		{/each}
	</div>
</fieldset>

<!-- Sélecteur format -->
<fieldset class="mb-8">
	<legend class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Format</legend>
	<div class="flex flex-wrap gap-2">
		{#each availableFormats as f}
			<label class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm transition-colors {selectedFormat === f ? 'border-blue-600 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 hover:border-gray-400'}">
				<input type="radio" bind:group={selectedFormat} value={f} class="sr-only" onchange={() => { selectedSlot = null }} />
				{FORMAT_LABELS[f] ?? f}
			</label>
		{/each}
	</div>
</fieldset>

{#if currentTemplate}
	<div class="lg:flex lg:gap-6">
		<!-- Colonne gauche : slots groupés par catégorie -->
		<div class="min-w-0 transition-all duration-300 {selectedSlot ? 'lg:w-96 lg:shrink-0' : 'flex-1'} overflow-hidden">
			<div class="overflow-hidden rounded-lg border border-gray-200">
				{#each slotsByCategory() as group, gi}
					<!-- En-tête catégorie -->
					<div class="{gi > 0 ? 'border-t-4 border-gray-200' : ''} bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
						{group.categoryDisplayName}
					</div>
					<!-- Slots de la catégorie -->
					{#each group.slots as slot, si}
						{@const isSelected = selectedSlot?.id === slot.id}
						<button
							type="button"
							class="flex w-full items-center px-3 py-2 text-left text-sm transition-colors {si > 0 ? 'border-t border-gray-100' : ''} {isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}"
							onclick={() => selectSlot(slot)}
						>
							<span class="flex-1 text-gray-700">{slot.sectionDisplayName}</span>
							{#if !selectedSlot}
								<span class="w-10 shrink-0 text-right text-xs text-gray-400">{slot.questionCount} q.</span>
							{/if}
							<span class="ml-2 flex w-12 shrink-0 items-center justify-end gap-1">
								{#if slot.pinnedQuestionId !== null}
									<span class="text-blue-500" title="Question épinglée">📌</span>
								{/if}
								{#if slot.preferredQuestionIds.length > 0}
									<span class="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
										{slot.preferredQuestionIds.length}⭐
									</span>
								{/if}
							</span>
						</button>
					{/each}
				{/each}
			</div>
		</div>

		<!-- Panneau droit : détail du slot (desktop uniquement) -->
		{#if selectedSlot}
			{@const slot = selectedSlot}
			<div class="hidden lg:block lg:min-w-0 lg:flex-1">
				<div class="sticky top-4 rounded-lg border border-gray-200 bg-white p-6">
					<div class="mb-4 flex items-start justify-between">
						<div>
							<p class="text-xs text-gray-400 uppercase tracking-wide">{slot.categoryDisplayName}</p>
							<h2 class="mt-1 text-base font-semibold text-gray-900">{slot.sectionDisplayName}</h2>
							<p class="mt-0.5 text-sm text-gray-500">{slot.questionCount} question{slot.questionCount > 1 ? 's' : ''}</p>
						</div>
						<button onclick={closePanel} class="text-gray-400 hover:text-gray-600" aria-label="Fermer">✕</button>
					</div>

					{#if form?.error}
						<p class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</p>
					{/if}

					<!-- Question épinglée -->
					<div class="mb-6">
						<h3 class="mb-2 text-sm font-medium text-gray-700">Question épinglée</h3>
						{#if slot.pinnedQuestionId !== null}
							<div class="flex items-center justify-between rounded-md border {slot.pinnedQuestionAvailable ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'} px-3 py-2">
								<div>
									<span class="text-sm {slot.pinnedQuestionAvailable ? 'text-blue-900' : 'text-amber-900'}">📌 {slot.pinnedQuestionTitle ?? `#${slot.pinnedQuestionId}`}</span>
									{#if !slot.pinnedQuestionAvailable}
										<p class="mt-0.5 text-xs text-amber-700">⚠ Question dépubliée — sera ignorée au tirage</p>
									{/if}
								</div>
								<form method="POST" action="?/setPinned" use:enhance={() => async ({ result, update }) => { await update(); if (result.type === 'success') resyncSelectedSlot() }}>
									<input type="hidden" name="slotId" value={slot.id} />
									<input type="hidden" name="questionId" value="" />
									<button type="submit" class="ml-3 text-xs {slot.pinnedQuestionAvailable ? 'text-blue-600 hover:text-blue-800' : 'text-amber-700 hover:text-amber-900'} hover:underline">Retirer</button>
								</form>
							</div>
						{:else}
							<p class="mb-2 text-sm text-gray-400">Aucune question épinglée</p>
						{/if}
						<button onclick={openPinned} class="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
							{slot.pinnedQuestionId !== null ? 'Changer' : 'Épingler une question'}
						</button>
					</div>

					<!-- Questions préférées -->
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-700">Questions préférées ({slot.preferredQuestionIds.length})</h3>
						{#if slot.preferredQuestions.length > 0}
							<ul class="mb-3 space-y-1">
								{#each slot.preferredQuestions as q}
									<li class="flex items-center gap-2 rounded-md border {q.available ? 'border-purple-100 bg-purple-50' : 'border-amber-200 bg-amber-50'} px-3 py-1.5 text-sm {q.available ? 'text-purple-900' : 'text-amber-900'}">
										<span>⭐</span>
										<span class="flex-1 truncate {q.available ? '' : 'line-through opacity-60'}">{q.title}</span>
										{#if !q.available}
											<span class="text-xs text-amber-600">⚠ dépubliée</span>
										{:else}
											<span class="text-xs text-purple-400">#{q.id}</span>
										{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<p class="mb-3 text-sm text-gray-400">Aucune question préférée</p>
						{/if}
						<button onclick={openPreferred} class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
							Gérer les préférées
						</button>
					</div>

						<!-- Formulaires cachés -->
					<form method="POST" action="?/setPinned" use:enhance={() => async ({ result, update }) => { await update(); if (result.type === 'success') resyncSelectedSlot() }} class="hidden" bind:this={setPinnedForm}>
						<input type="hidden" name="slotId" value={slot.id} />
						<input type="hidden" name="questionId" bind:this={setPinnedQuestionIdInput} />
					</form>
					<form method="POST" action="?/setPreferred" use:enhance={() => async ({ result, update }) => { await update(); if (result.type === 'success') resyncSelectedSlot() }} class="hidden" bind:this={setPreferredForm}>
						<input type="hidden" name="slotId" value={slot.id} />
						<input type="hidden" name="questionIds" bind:this={setPreferredQuestionIdsInput} />
					</form>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<p class="text-sm text-gray-400">Aucun template trouvé pour cette combinaison.</p>
{/if}

<!-- Panneau détail du slot (mobile plein écran) -->
{#if selectedSlot}
	{@const slot = selectedSlot}
	<div class="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
			<div>
				<p class="text-xs text-gray-400 uppercase tracking-wide">{slot.categoryDisplayName}</p>
				<p class="text-sm font-semibold text-gray-900">{slot.sectionDisplayName}</p>
			</div>
			<button type="button" onclick={closePanel} class="ml-2 shrink-0 text-gray-400 hover:text-gray-700" aria-label="Fermer">
				✕ Fermer
			</button>
		</div>
		<div class="flex-1 overflow-y-auto p-4 space-y-6">
			<p class="text-sm text-gray-500">{slot.questionCount} question{slot.questionCount > 1 ? 's' : ''}</p>

			{#if form?.error}
				<p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</p>
			{/if}

			<!-- Question épinglée -->
			<div>
				<h3 class="mb-2 text-sm font-medium text-gray-700">Question épinglée</h3>
				{#if slot.pinnedQuestionId !== null}
					<div class="flex items-center justify-between rounded-md border {slot.pinnedQuestionAvailable ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'} px-3 py-2">
						<div>
							<span class="text-sm {slot.pinnedQuestionAvailable ? 'text-blue-900' : 'text-amber-900'}">📌 {slot.pinnedQuestionTitle ?? `#${slot.pinnedQuestionId}`}</span>
							{#if !slot.pinnedQuestionAvailable}
								<p class="mt-0.5 text-xs text-amber-700">⚠ Question dépubliée — sera ignorée au tirage</p>
							{/if}
						</div>
						<form method="POST" action="?/setPinned" use:enhance>
							<input type="hidden" name="slotId" value={slot.id} />
							<input type="hidden" name="questionId" value="" />
							<button type="submit" class="ml-3 text-xs {slot.pinnedQuestionAvailable ? 'text-blue-600 hover:text-blue-800' : 'text-amber-700 hover:text-amber-900'} hover:underline">Retirer</button>
						</form>
					</div>
				{:else}
					<p class="mb-2 text-sm text-gray-400">Aucune question épinglée</p>
				{/if}
				<button onclick={openPinned} class="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
					{slot.pinnedQuestionId !== null ? 'Changer' : 'Épingler une question'}
				</button>
			</div>

			<!-- Questions préférées -->
			<div>
				<h3 class="mb-2 text-sm font-medium text-gray-700">Questions préférées ({slot.preferredQuestionIds.length})</h3>
				{#if slot.preferredQuestions.length > 0}
					<ul class="mb-3 space-y-1">
						{#each slot.preferredQuestions as q}
							<li class="flex items-center gap-2 rounded-md border {q.available ? 'border-purple-100 bg-purple-50' : 'border-amber-200 bg-amber-50'} px-3 py-1.5 text-sm {q.available ? 'text-purple-900' : 'text-amber-900'}">
								<span>⭐</span>
								<span class="flex-1 truncate {q.available ? '' : 'line-through opacity-60'}">{q.title}</span>
								{#if !q.available}
									<span class="text-xs text-amber-600">⚠ dépubliée</span>
								{:else}
									<span class="text-xs text-purple-400">#{q.id}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mb-3 text-sm text-gray-400">Aucune question préférée</p>
				{/if}
				<button onclick={openPreferred} class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
					Gérer les préférées
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- QuestionPickerModal -->
{#if pickerSlot() && pickerSupport()}
	<QuestionPickerModal
		open={pickerOpen}
		slot={pickerSlot()!}
		support={pickerSupport()}
		selectedIds={pickerSelectedIds()}
		onapply={handlePickerApply}
		onclose={() => (pickerOpen = false)}
	/>
{/if}
