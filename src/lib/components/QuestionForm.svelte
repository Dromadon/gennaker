<script lang="ts">
	import { untrack } from 'svelte'
	import { marked } from 'marked'
	import type { CategoryWithSections, QuestionAdminDetail } from '$lib/domain/types'

	type Props = {
		categories: CategoryWithSections[]
		question?: Partial<QuestionAdminDetail>
		errors?: Record<string, string[]>
		action: string
	}

	let { categories, question = {}, errors = {}, action }: Props = $props()

	const supports = ['deriveur', 'catamaran', 'windsurf', 'croisiere'] as const
	const difficulties = ['facile', 'moyen', 'difficile'] as const
	const answerSizes = ['xs', 'sm', 'md', 'lg'] as const
	const statuses = [
		{ value: 'brouillon', label: 'Brouillon' },
		{ value: 'publie', label: 'Publié' }
	]

	// Capture all original values once at mount — intentionally not reactive.
	const orig = untrack(() => ({
		isEditMode: !!question.id,
		categoryId: question.sectionId
			? String(
					categories.find((c) => c.sections.some((s) => s.id === question.sectionId))?.id ?? ''
				)
			: '',
		sectionId: question.sectionId ? String(question.sectionId) : '',
		title: question.title ?? '',
		difficulty: question.difficulty ?? difficulties[0],
		answerSize: question.answerSize ?? answerSizes[0],
		status: question.status ?? statuses[0].value,
		applicableSupports: [...(question.applicableSupports ?? [])],
		questionMd: question.questionMd ?? '',
		correctionMd: question.correctionMd ?? '',
		sourceMd: question.sourceMd ?? ''
	}))

	let selectedCategoryId = $state(orig.categoryId)
	let selectedSectionId = $state(orig.sectionId)

	const isEditMode = orig.isEditMode
	let isLocationLocked = $state(orig.isEditMode)
	let locationDialog = $state<HTMLDialogElement | undefined>()

	const visibleSections = $derived(
		selectedCategoryId
			? (categories.find((c) => String(c.id) === selectedCategoryId)?.sections ?? [])
			: []
	)

	function toggleLock() {
		if (isEditMode && isLocationLocked) {
			locationDialog?.showModal()
		} else {
			isLocationLocked = !isLocationLocked
		}
	}

	let title = $state(orig.title)
	let difficulty = $state(orig.difficulty)
	let answerSize = $state(orig.answerSize)
	let status = $state(orig.status)
	let applicableSupports = $state<string[]>(orig.applicableSupports)
	let questionMd = $state(orig.questionMd)
	let correctionMd = $state(orig.correctionMd)
	let sourceMd = $state(orig.sourceMd)

	const dirty = $derived(
		isEditMode
			? {
					title: title !== orig.title,
					location: selectedSectionId !== orig.sectionId || selectedCategoryId !== orig.categoryId,
					difficulty: difficulty !== orig.difficulty,
					answerSize: answerSize !== orig.answerSize,
					status: status !== orig.status,
					applicableSupports:
						[...applicableSupports].sort().join() !== [...orig.applicableSupports].sort().join(),
					questionMd: questionMd !== orig.questionMd,
					correctionMd: correctionMd !== orig.correctionMd,
					sourceMd: sourceMd !== orig.sourceMd
				}
			: null
	)

	const BAR = 'border-yellow-400'

	const border = $derived({
		title:      errors.title      ? 'border-red-400' : '',
		category:   errors.category   ? 'border-red-400' : '',
		sectionId:  errors.sectionId  ? 'border-red-400' : '',
		difficulty: errors.difficulty ? 'border-red-400' : '',
		answerSize: errors.answerSize ? 'border-red-400' : '',
		status:     errors.status     ? 'border-red-400' : '',
		sourceMd:   errors.sourceMd   ? 'border-red-400' : '',
	})

	const questionPreview = $derived(marked.parse(questionMd || '') as string)
	const correctionPreview = $derived(marked.parse(correctionMd || '') as string)

	let activeTab = $state<'question' | 'correction'>('question')
</script>

<form method="POST" {action} class="space-y-6">
	<!-- Titre -->
	<div class="border-l-2 pl-2 transition {dirty?.title ? BAR : 'border-transparent'}">
		<label for="title" class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
		<input
			id="title"
			name="title"
			type="text"
			bind:value={title}
			class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition {border.title}"
		/>
		{#if errors.title}<p class="mt-1 text-xs text-red-600">{errors.title[0]}</p>{/if}
	</div>

	<!-- Catégorie / Section avec verrouillage -->
	<div class="flex gap-3 items-start border-l-2 pl-2 transition {dirty?.location ? BAR : 'border-transparent'}">
		<div class="flex-1">
			<label for="category" class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
			<select
				id="category"
				bind:value={selectedCategoryId}
				onchange={() => { selectedSectionId = '' }}
				disabled={isLocationLocked}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition {isLocationLocked ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : border.category}"
			>
				<option value="">— choisir —</option>
				{#each categories as cat}
					<option value={String(cat.id)}>{cat.displayName}</option>
				{/each}
			</select>
		</div>
		<div class="flex-1">
			<label for="sectionId" class="block text-sm font-medium text-gray-700 mb-1">Section</label>
			<select
				id="sectionId"
				name={isLocationLocked ? undefined : 'sectionId'}
				bind:value={selectedSectionId}
				disabled={!selectedCategoryId || isLocationLocked}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition {isLocationLocked ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : border.sectionId}"
			>
				<option value="">— choisir —</option>
				{#each visibleSections as sec}
					<option value={String(sec.id)}>{sec.displayName}</option>
				{/each}
			</select>
			{#if isLocationLocked}
				<input type="hidden" name="sectionId" value={selectedSectionId} />
			{/if}
			{#if errors.sectionId}<p class="mt-1 text-xs text-red-600">{errors.sectionId[0]}</p>{/if}
		</div>
		{#if isEditMode}
			<div class="pt-6">
				<button
					type="button"
					onclick={toggleLock}
					title={isLocationLocked ? 'Déverrouiller catégorie et section' : 'Verrouiller catégorie et section'}
					class="flex items-center justify-center h-[38px] w-10 rounded-md border border-gray-200 text-base hover:bg-gray-50 transition"
				>
					{isLocationLocked ? '🔒' : '🔓'}
				</button>
			</div>
		{/if}
	</div>

	<!-- Difficulté / Answer size / Status -->
	<div class="grid grid-cols-3 gap-4">
		<div class="border-l-2 pl-2 transition {dirty?.difficulty ? BAR : 'border-transparent'}">
			<label for="difficulty" class="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
			<select
				id="difficulty"
				name="difficulty"
				bind:value={difficulty}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition {border.difficulty}"
			>
				{#each difficulties as d}
					<option value={d}>{d}</option>
				{/each}
			</select>
		</div>
		<div class="border-l-2 pl-2 transition {dirty?.answerSize ? BAR : 'border-transparent'}">
			<label for="answerSize" class="block text-sm font-medium text-gray-700 mb-1">Taille réponse</label>
			<select
				id="answerSize"
				name="answerSize"
				bind:value={answerSize}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition {border.answerSize}"
			>
				{#each answerSizes as s}
					<option value={s}>{s}</option>
				{/each}
			</select>
		</div>
		<div class="border-l-2 pl-2 transition {dirty?.status ? BAR : 'border-transparent'}">
			<label for="status" class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
			<select
				id="status"
				name="status"
				bind:value={status}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition {border.status}"
			>
				{#each statuses as s}
					<option value={s.value}>{s.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Supports applicables -->
	<div class="border-l-2 pl-2 transition {dirty?.applicableSupports ? BAR : 'border-transparent'}">
		<fieldset>
			<legend class="block text-sm font-medium text-gray-700 mb-2">Supports applicables (vide = tous)</legend>
			<div class="flex gap-4">
				{#each supports as s}
					<label class="flex items-center gap-1.5 text-sm text-gray-600">
						<input
							type="checkbox"
							name="applicableSupports"
							value={s}
							checked={applicableSupports.includes(s)}
							onchange={(e) => {
								if (e.currentTarget.checked) {
									applicableSupports = [...applicableSupports, s]
								} else {
									applicableSupports = applicableSupports.filter((x) => x !== s)
								}
							}}
						/>
						{s}
					</label>
				{/each}
			</div>
		</fieldset>
	</div>

	<!-- Éditeur markdown : onglets énoncé / correction -->
	<div class="border-l-2 pl-2 transition {dirty?.questionMd || dirty?.correctionMd ? BAR : 'border-transparent'}">
		<div class="flex gap-1 mb-0 border-b border-gray-200">
			<button
				type="button"
				onclick={() => (activeTab = 'question')}
				class="px-4 py-2 text-sm font-medium rounded-t-md {activeTab === 'question' ? 'bg-white border border-b-white border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
			>
				Énoncé
			</button>
			<button
				type="button"
				onclick={() => (activeTab = 'correction')}
				class="px-4 py-2 text-sm font-medium rounded-t-md {activeTab === 'correction' ? 'bg-white border border-b-white border-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}"
			>
				Correction
			</button>
		</div>

		{#if activeTab === 'question'}
			<div class="grid grid-cols-2 gap-0 border border-gray-200 rounded-b-md rounded-tr-md transition {errors.questionMd ? 'border-red-400' : ''}">
				<textarea
					name="questionMd"
					bind:value={questionMd}
					rows="14"
					class="w-full resize-none border-0 border-r border-gray-200 p-3 font-mono text-sm focus:outline-none rounded-bl-md"
					placeholder="Énoncé en markdown…"
				></textarea>
				<div class="prose prose-sm max-w-none p-3 overflow-y-auto text-sm">
					{@html questionPreview}
				</div>
			</div>
			{#if errors.questionMd}<p class="mt-1 text-xs text-red-600">{errors.questionMd[0]}</p>{/if}
		{:else}
			<div class="grid grid-cols-2 gap-0 border border-gray-200 rounded-b-md rounded-tr-md transition {errors.correctionMd ? 'border-red-400' : ''}">
				<textarea
					name="correctionMd"
					bind:value={correctionMd}
					rows="14"
					class="w-full resize-none border-0 border-r border-gray-200 p-3 font-mono text-sm focus:outline-none rounded-bl-md"
					placeholder="Correction en markdown…"
				></textarea>
				<div class="prose prose-sm max-w-none p-3 overflow-y-auto text-sm">
					{@html correctionPreview}
				</div>
			</div>
		{/if}
	</div>

	<!-- Source -->
	<div class="border-l-2 pl-2 transition {dirty?.sourceMd ? BAR : 'border-transparent'}">
		<label for="sourceMd" class="block text-sm font-medium text-gray-700 mb-1">Source (optionnel)</label>
		<input
			id="sourceMd"
			name="sourceMd"
			type="text"
			bind:value={sourceMd}
			class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm transition {border.sourceMd}"
		/>
	</div>

	<!-- Actions -->
	<div class="flex justify-between pt-2">
		<a href="/admin/questions" class="text-sm text-gray-500 hover:text-gray-900">← Retour</a>
		<button
			type="submit"
			class="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700"
		>
			Enregistrer
		</button>
	</div>
</form>

<!-- Dialog changement catégorie/section -->
{#if isEditMode}
	<dialog bind:this={locationDialog} class="rounded-lg p-6 shadow-xl backdrop:bg-black/40 max-w-sm w-full">
		<h2 class="mb-2 text-base font-semibold text-gray-900">Changer la catégorie ou la section ?</h2>
		<p class="mb-6 text-sm text-gray-500">
			Vous allez déplacer cette question vers une autre catégorie ou section. Êtes-vous sûr·e ?
		</p>
		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={() => {
					locationDialog?.close()
					isLocationLocked = true
				}}
				class="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
			>
				Annuler
			</button>
			<button
				type="button"
				onclick={() => {
					locationDialog?.close()
					isLocationLocked = false
				}}
				class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
			>
				Oui, déverrouiller
			</button>
		</div>
	</dialog>
{/if}
