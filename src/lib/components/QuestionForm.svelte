<script lang="ts">
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

	let selectedCategoryId = $state(
		question.sectionId
			? String(
					categories.find((c) => c.sections.some((s) => s.id === question.sectionId))?.id ?? ''
				)
			: ''
	)
	let selectedSectionId = $state(question.sectionId ? String(question.sectionId) : '')

	const visibleSections = $derived(
		selectedCategoryId
			? (categories.find((c) => c.id === Number(selectedCategoryId))?.sections ?? [])
			: []
	)

	let questionMd = $state(question.questionMd ?? '')
	let correctionMd = $state(question.correctionMd ?? '')

	const questionPreview = $derived(marked.parse(questionMd || '') as string)
	const correctionPreview = $derived(marked.parse(correctionMd || '') as string)

	let activeTab = $state<'question' | 'correction'>('question')
</script>

<form method="POST" {action} class="space-y-6">
	<!-- Titre -->
	<div>
		<label for="title" class="block text-sm font-medium text-gray-700 mb-1">Titre</label>
		<input
			id="title"
			name="title"
			type="text"
			value={question.title ?? ''}
			class="w-full rounded-md border px-3 py-2 text-sm {errors.title ? 'border-red-400' : 'border-gray-300'}"
		/>
		{#if errors.title}<p class="mt-1 text-xs text-red-600">{errors.title[0]}</p>{/if}
	</div>

	<!-- Catégorie / Section -->
	<div class="grid grid-cols-2 gap-4">
		<div>
			<label for="category" class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
			<select
				id="category"
				bind:value={selectedCategoryId}
				onchange={() => { selectedSectionId = '' }}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
			>
				<option value="">— choisir —</option>
				{#each categories as cat}
					<option value={cat.id}>{cat.displayName}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="sectionId" class="block text-sm font-medium text-gray-700 mb-1">Section</label>
			<select
				id="sectionId"
				name="sectionId"
				bind:value={selectedSectionId}
				disabled={!selectedCategoryId}
				class="w-full rounded-md border px-3 py-2 text-sm disabled:opacity-50 {errors.sectionId ? 'border-red-400' : 'border-gray-300'}"
			>
				<option value="">— choisir —</option>
				{#each visibleSections as sec}
					<option value={sec.id}>{sec.displayName}</option>
				{/each}
			</select>
			{#if errors.sectionId}<p class="mt-1 text-xs text-red-600">{errors.sectionId[0]}</p>{/if}
		</div>
	</div>

	<!-- Difficulté / Answer size / Status -->
	<div class="grid grid-cols-3 gap-4">
		<div>
			<label for="difficulty" class="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
			<select
				id="difficulty"
				name="difficulty"
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
			>
				{#each difficulties as d}
					<option value={d} selected={question.difficulty === d}>{d}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="answerSize" class="block text-sm font-medium text-gray-700 mb-1">Taille réponse</label>
			<select
				id="answerSize"
				name="answerSize"
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
			>
				{#each answerSizes as s}
					<option value={s} selected={question.answerSize === s}>{s}</option>
				{/each}
			</select>
		</div>
		<div>
			<label for="status" class="block text-sm font-medium text-gray-700 mb-1">Statut</label>
			<select
				id="status"
				name="status"
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
			>
				{#each statuses as s}
					<option value={s.value} selected={question.status === s.value}>{s.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Supports applicables -->
	<div>
		<fieldset>
			<legend class="block text-sm font-medium text-gray-700 mb-2">Supports applicables (vide = tous)</legend>
			<div class="flex gap-4">
				{#each supports as s}
					<label class="flex items-center gap-1.5 text-sm text-gray-600">
						<input
							type="checkbox"
							name="applicableSupports"
							value={s}
							checked={question.applicableSupports?.includes(s) ?? false}
						/>
						{s}
					</label>
				{/each}
			</div>
		</fieldset>
	</div>

	<!-- Éditeur markdown : onglets énoncé / correction -->
	<div>
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
			<div class="grid grid-cols-2 gap-0 border border-gray-200 rounded-b-md rounded-tr-md">
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
			<div class="grid grid-cols-2 gap-0 border border-gray-200 rounded-b-md rounded-tr-md">
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
	<div>
		<label for="sourceMd" class="block text-sm font-medium text-gray-700 mb-1">Source (optionnel)</label>
		<input
			id="sourceMd"
			name="sourceMd"
			type="text"
			value={question.sourceMd ?? ''}
			class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
