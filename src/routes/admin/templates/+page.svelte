<script lang="ts">
	import { enhance } from '$app/forms'
	import type { PageData, ActionData } from './$types'
	import type { TemplateSlotWithResolved, TemplateWithSlots } from '$lib/server/db/queries/templates'
	import QuestionPickerModal from '$lib/components/QuestionPickerModal.svelte'
	import type { EvaluationSlot, Support } from '$lib/domain/types'

	let { data, form }: { data: PageData; form: ActionData } = $props()

	let selectedSlot = $state<TemplateSlotWithResolved | null>(null)
	let selectedTemplate = $state<TemplateWithSlots | null>(null)

	let pickerOpen = $state(false)
	let pickerMode = $state<'pinned' | 'preferred'>('pinned')

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

	const templatesBySupport = $derived(() => {
		const map = new Map<string, TemplateWithSlots[]>()
		for (const s of supportOrder) {
			const group = data.templates
				.filter((t) => t.supportSlug === s)
				.sort((a, b) => formatOrder.indexOf(a.format) - formatOrder.indexOf(b.format))
			if (group.length > 0) map.set(s, group)
		}
		return map
	})

	function selectSlot(slot: TemplateSlotWithResolved, template: TemplateWithSlots) {
		selectedSlot = slot
		selectedTemplate = template
	}

	function closePanel() {
		selectedSlot = null
		selectedTemplate = null
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

	const pickerSupport = $derived((): Support => (selectedTemplate?.supportSlug ?? 'deriveur') as Support)

	const pickerSelectedIds = $derived((): number[] => {
		if (!selectedSlot) return []
		if (pickerMode === 'pinned') return selectedSlot.pinnedQuestionId !== null ? [selectedSlot.pinnedQuestionId] : []
		return selectedSlot.preferredQuestionIds
	})

	// Formulaires cachés soumis par JS après le picker
	let setPinnedForm: HTMLFormElement
	let setPreferredForm: HTMLFormElement
	let setPinnedQuestionIdInput: HTMLInputElement
	let setPreferredQuestionIdsInput: HTMLInputElement

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

<div class="lg:flex lg:gap-6">
	<!-- Colonne gauche : liste des templates / slots -->
	<div class="min-w-0 transition-all duration-300 {selectedSlot ? 'lg:w-96 lg:shrink-0' : 'flex-1'} overflow-hidden">
		{#each [...templatesBySupport()] as [support, templates]}
			<div class="mb-6">
				<h2 class="mb-2 text-base font-semibold text-gray-800">{SUPPORT_LABELS[support] ?? support}</h2>
				{#each templates as template}
					<div class="mb-4">
						<h3 class="mb-1 text-sm font-medium text-gray-500 uppercase tracking-wide">{FORMAT_LABELS[template.format] ?? template.format}</h3>
						<div class="overflow-hidden rounded-lg border border-gray-200">
							<table class="w-full text-sm">
								<tbody class="divide-y divide-gray-100">
									{#each template.slots as slot}
										{@const isSelected = selectedSlot?.id === slot.id}
										<tr
											class="cursor-pointer transition-colors {isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}"
											onclick={() => selectSlot(slot, template)}
										>
											<td class="w-8 px-3 py-2">
												<span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
													{slot.position}
												</span>
											</td>
											<td class="px-3 py-2 text-gray-700">
												{#if selectedSlot}
													<span class="font-medium">{slot.sectionDisplayName}</span>
												{:else}
													<span class="text-xs text-gray-400">{slot.categoryDisplayName}</span>
													<span class="mx-1 text-gray-300">/</span>
													<span class="font-medium">{slot.sectionDisplayName}</span>
												{/if}
											</td>
											{#if !selectedSlot}
												<td class="px-3 py-2 text-right text-gray-400 text-xs">{slot.questionCount} q.</td>
											{/if}
											<td class="px-3 py-2">
												<div class="flex items-center gap-1 justify-end">
													{#if slot.pinnedQuestionId !== null}
														<span class="text-blue-500" title="Question épinglée">📌</span>
													{/if}
													{#if slot.preferredQuestionIds.length > 0}
														<span class="inline-flex items-center rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
															{slot.preferredQuestionIds.length}⭐
														</span>
													{/if}
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/each}
			</div>
		{/each}
	</div>

	<!-- Panneau droit : détail du slot -->
	{#if selectedSlot && selectedTemplate}
		{@const slot = selectedSlot}
		{@const template = selectedTemplate}
		<div class="mt-6 lg:mt-0 lg:flex-1">
			<div class="rounded-lg border border-gray-200 bg-white p-6">
				<!-- En-tête -->
				<div class="mb-4 flex items-start justify-between">
					<div>
						<p class="text-xs text-gray-400 uppercase tracking-wide">{SUPPORT_LABELS[template.supportSlug]} · {FORMAT_LABELS[template.format]} · Position {slot.position}</p>
						<h2 class="mt-1 text-base font-semibold text-gray-900">{slot.categoryDisplayName} / {slot.sectionDisplayName}</h2>
						<p class="mt-0.5 text-sm text-gray-500">{slot.questionCount} question{slot.questionCount > 1 ? 's' : ''}</p>
					</div>
					<button
						onclick={closePanel}
						class="text-gray-400 hover:text-gray-600"
						aria-label="Fermer"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{#if form?.error}
					<p class="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{form.error}</p>
				{/if}

				<!-- Question épinglée -->
				<div class="mb-6">
					<h3 class="mb-2 text-sm font-medium text-gray-700">Question épinglée</h3>
					{#if slot.pinnedQuestionId !== null}
						<div class="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
							<span class="text-sm text-blue-900">📌 {slot.pinnedQuestionTitle ?? `#${slot.pinnedQuestionId}`}</span>
							<form
								method="POST"
								action="?/setPinned"
								use:enhance
								bind:this={setPinnedForm}
							>
								<input type="hidden" name="slotId" value={slot.id} />
								<input type="hidden" name="questionId" value="" bind:this={setPinnedQuestionIdInput} />
								<button type="submit" class="ml-3 text-xs text-blue-600 hover:text-blue-800 hover:underline">
									Retirer
								</button>
							</form>
						</div>
					{:else}
						<p class="mb-2 text-sm text-gray-400">Aucune question épinglée</p>
					{/if}
					<button
						onclick={openPinned}
						class="mt-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
					>
						{slot.pinnedQuestionId !== null ? 'Changer' : 'Épingler une question'}
					</button>
				</div>

				<!-- Questions préférées -->
				<div>
					<h3 class="mb-2 text-sm font-medium text-gray-700">Questions préférées ({slot.preferredQuestionIds.length})</h3>
					{#if slot.preferredQuestions.length > 0}
						<ul class="mb-3 space-y-1">
							{#each slot.preferredQuestions as q}
								<li class="flex items-center gap-2 rounded-md border border-purple-100 bg-purple-50 px-3 py-1.5 text-sm text-purple-900">
									<span>⭐</span>
									<span class="flex-1 truncate">{q.title}</span>
									<span class="text-xs text-purple-400">#{q.id}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="mb-3 text-sm text-gray-400">Aucune question préférée</p>
					{/if}
					<button
						onclick={openPreferred}
						class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
					>
						Gérer les préférées
					</button>
				</div>

				<!-- Formulaires cachés pour setPreferred -->
				<form method="POST" action="?/setPinned" use:enhance class="hidden" bind:this={setPinnedForm}>
					<input type="hidden" name="slotId" value={slot.id} />
					<input type="hidden" name="questionId" bind:this={setPinnedQuestionIdInput} />
				</form>
				<form method="POST" action="?/setPreferred" use:enhance class="hidden" bind:this={setPreferredForm}>
					<input type="hidden" name="slotId" value={slot.id} />
					<input type="hidden" name="questionIds" bind:this={setPreferredQuestionIdsInput} />
				</form>
			</div>
		</div>
	{/if}
</div>

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
