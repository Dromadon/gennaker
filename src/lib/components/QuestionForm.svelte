<script lang="ts">
	import { untrack } from 'svelte'
	import { page } from '$app/state'
	import { enhance } from '$app/forms'
	import type { CategoryWithSections, QuestionAdminDetail } from '$lib/domain/types'
	import { createLocalMarkdownRenderer, extractImageRefs } from '$lib/markdown'
	import ImagePanel from '$lib/components/ImagePanel.svelte'

	type Props = {
		categories: CategoryWithSections[]
		question?: Partial<QuestionAdminDetail>
		errors?: Record<string, string[]>
		action: string
		questionId?: number
		existingImages?: string[]
	}

	let { categories, question = {}, errors = {}, action, questionId, existingImages = [] }: Props = $props()

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

	function reset() {
		title = orig.title
		selectedCategoryId = orig.categoryId
		selectedSectionId = orig.sectionId
		difficulty = orig.difficulty
		answerSize = orig.answerSize
		status = orig.status
		applicableSupports = [...orig.applicableSupports]
		questionMd = orig.questionMd
		correctionMd = orig.correctionMd
		sourceMd = orig.sourceMd
		isLocationLocked = true
	}

	const anyDirty = $derived(dirty !== null && Object.values(dirty).some(Boolean))

	// Images
	type PendingImage = { file: File; objectUrl: string }
	let pendingImages = $state(new Map<string, PendingImage>())
	let questionTextarea = $state<HTMLTextAreaElement | undefined>(undefined)
	let correctionTextarea = $state<HTMLTextAreaElement | undefined>(undefined)
	let lastFocusedField = $state<'question' | 'correction'>('question')

	const r2BaseUrl = $derived(page.data.r2BaseUrl as string)

	const questionPreview = $derived(
		createLocalMarkdownRenderer(pendingImages, questionId ?? 0, r2BaseUrl)(questionMd || '')
	)
	const correctionPreview = $derived(
		createLocalMarkdownRenderer(pendingImages, questionId ?? 0, r2BaseUrl)(correctionMd || '')
	)

	// Submit via enhance : SvelteKit gère D1, on enchaîne les uploads R2 après succès
	let submitError = $state('')
	let isSubmitting = $state(false)

	function handleEnhance() {
		isSubmitting = true
		submitError = ''

		return async ({ result, update }: { result: import('@sveltejs/kit').ActionResult; update: () => Promise<void> }) => {
			if (result.type === 'redirect') {
				// Création : le serveur redirige vers /edit — on laisse SvelteKit suivre
				await update()
				return
			}

			if (result.type === 'failure' || result.type === 'error') {
				isSubmitting = false
				window.location.reload()
				return
			}

			// Succès D1 — upload des images pending
			const id = questionId
			if (id && pendingImages.size > 0) {
				const uploadErrors: string[] = []
				const refs = new Set([...extractImageRefs(questionMd), ...extractImageRefs(correctionMd)])
				await Promise.all(
					[...pendingImages.entries()]
					.filter(([filename]) => refs.has(filename))
					.map(async ([filename, { file, objectUrl }]) => {
						const fd = new FormData()
						fd.append('file', file)
						const res = await fetch(`/admin/questions/${id}/images`, { method: 'POST', body: fd })
						if (!res.ok) {
							uploadErrors.push(filename)
						} else {
							URL.revokeObjectURL(objectUrl)
						}
					})
				)
				if (uploadErrors.length > 0) {
					submitError = `Question sauvegardée, mais ${uploadErrors.length} image(s) n'ont pas pu être uploadées : ${uploadErrors.join(', ')}`
				}
			}

			isSubmitting = false
			window.location.reload()
		}
	}
</script>


<form method="POST" {action} use:enhance={handleEnhance} class="space-y-6">
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

	<!-- Éditeur markdown : énoncé -->
	<div class="border-l-2 pl-2 transition {dirty?.questionMd ? BAR : 'border-transparent'}">
		<label for="questionMd" class="block text-sm font-medium text-gray-700 mb-1">Énoncé</label>
		<div class="grid grid-cols-2 gap-0 border border-gray-200 rounded-md transition {errors.questionMd ? 'border-red-400' : ''}">
			<textarea
				id="questionMd"
				bind:this={questionTextarea}
				name="questionMd"
				bind:value={questionMd}
				rows="12"
				onfocus={() => (lastFocusedField = 'question')}
				class="w-full resize-none border-0 border-r border-gray-200 p-3 font-mono text-sm focus:outline-none rounded-l-md"
				placeholder="Énoncé en markdown…"
			></textarea>
			<div class="prose prose-sm max-w-none p-3 overflow-y-auto text-sm">
				{@html questionPreview}
			</div>
		</div>
		{#if errors.questionMd}<p class="mt-1 text-xs text-red-600">{errors.questionMd[0]}</p>{/if}
	</div>

	<!-- Éditeur markdown : correction -->
	<div class="border-l-2 pl-2 transition {dirty?.correctionMd ? BAR : 'border-transparent'}">
		<label for="correctionMd" class="block text-sm font-medium text-gray-700 mb-1">Correction</label>
		<div class="grid grid-cols-2 gap-0 border border-gray-200 rounded-md transition {errors.correctionMd ? 'border-red-400' : ''}">
			<textarea
				id="correctionMd"
				bind:this={correctionTextarea}
				name="correctionMd"
				bind:value={correctionMd}
				rows="12"
				onfocus={() => (lastFocusedField = 'correction')}
				class="w-full resize-none border-0 border-r border-gray-200 p-3 font-mono text-sm focus:outline-none rounded-l-md"
				placeholder="Correction en markdown…"
			></textarea>
			<div class="prose prose-sm max-w-none p-3 overflow-y-auto text-sm">
				{@html correctionPreview}
			</div>
		</div>
		{#if errors.correctionMd}<p class="mt-1 text-xs text-red-600">{errors.correctionMd[0]}</p>{/if}
	</div>

	<!-- Panneau images -->
	<ImagePanel
		{existingImages}
		{questionId}
		{r2BaseUrl}
		bind:questionMd
		bind:correctionMd
		bind:pendingImages
		{lastFocusedField}
		{questionTextarea}
		{correctionTextarea}
	/>

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

	{#if submitError}
		<div class="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">{submitError}</div>
	{/if}

	<!-- Actions -->
	<div class="flex justify-end gap-2 pt-2">
		{#if isEditMode}
			<button
				type="button"
				onclick={reset}
				disabled={!anyDirty}
				class="rounded-md border px-5 py-2 text-sm font-medium transition {anyDirty ? 'border-gray-300 text-gray-600 hover:bg-gray-50' : 'border-gray-200 text-gray-300 cursor-not-allowed'}"
			>
				Réinitialiser
			</button>
		{/if}
		<button
			type="submit"
			disabled={isSubmitting}
			class="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
		>
			{isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
		</button>
	</div>
</form>

<!-- Dialog changement catégorie/section -->
{#if isEditMode}
	<dialog bind:this={locationDialog} class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-6 shadow-xl backdrop:bg-black/40 w-full max-w-sm">
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
