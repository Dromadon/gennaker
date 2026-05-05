<script lang="ts">
	import { marked } from 'marked'
	import { enhance } from '$app/forms'
	import type { PageData, ActionData } from './$types'
	import type { CategoryWithSections } from '$lib/domain/types'
	import MarkdownHelpDialog from '$lib/components/MarkdownHelpDialog.svelte'

	let { data, form }: { data: PageData; form: ActionData } = $props()

	const supports = [
		{ value: 'deriveur', label: 'Dériveur' },
		{ value: 'catamaran', label: 'Catamaran' },
		{ value: 'windsurf', label: 'Windsurf' },
		{ value: 'croisiere', label: 'Croisière' }
	] as const

	let selectedCategoryId = $state('')
	let selectedSectionId = $state('')

	const visibleSections = $derived(
		selectedCategoryId
			? (data.categories.find((c: CategoryWithSections) => String(c.id) === selectedCategoryId)?.sections ?? [])
			: []
	)

	let title = $state('')
	let questionMd = $state('')
	let correctionMd = $state('')
	let submitterName = $state('')
	let submitterEmail = $state('')
	let checkedSupports = $state<string[]>([])

	const questionPreview = $derived(marked.parse(questionMd || '') as string)
	const correctionPreview = $derived(marked.parse(correctionMd || '') as string)

	const titleCount = $derived(title.length)

	const errors = $derived(form?.errors ?? {})

	let markdownHelpDialog = $state<HTMLDialogElement | undefined>()
</script>

<svelte:head>
	<title>Proposer une question — Gennaker</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
<div class="mx-auto max-w-3xl px-6 py-10">
	<h1 class="text-2xl font-semibold text-gray-900 mb-2">Proposer une question</h1>
	<p class="text-sm text-gray-500 mb-8">
		Vous souhaitez contribuer à la banque de questions ? Remplissez ce formulaire, votre proposition sera examinée par l'équipe.
	</p>

	{#if form?.success}
		<div class="rounded-lg bg-green-50 border border-green-200 px-6 py-8 text-center">
			<p class="text-lg font-medium text-green-800 mb-1">Merci pour votre contribution !</p>
			<p class="text-sm text-green-700">Votre proposition a été transmise, merci</p>
			<a href="/questions" class="mt-4 inline-block text-sm text-green-700 underline hover:text-green-900">
				Retour à la banque de questions
			</a>
		</div>
	{:else}
		<div class="rounded-lg border border-gray-200 bg-white p-6">
		<form method="POST" action="?/submit" use:enhance class="space-y-6">
			<!-- Honeypot -->
			<input name="honeypot" type="text" tabindex="-1" autocomplete="off" style="display:none" aria-hidden="true" />

			<!-- Titre -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="title" class="block text-sm font-medium text-gray-700">
						Titre court <span class="text-red-500">*</span>
					</label>
					<span class="text-xs text-gray-400">{titleCount}/120</span>
				</div>
				<p class="text-xs text-gray-400 mb-1">Identifiant court de la question, n'apparaît pas dans les évaluations.</p>
				<input
					id="title"
					name="title"
					type="text"
					maxlength="120"
					bind:value={title}
					class="w-full rounded-md border px-3 py-2 text-sm {errors.title ? 'border-red-400' : 'border-gray-300'}"
				/>
				{#if errors.title}<p class="mt-1 text-xs text-red-600">{errors.title[0]}</p>{/if}
			</div>

			<!-- Catégorie / Section -->
			<div class="flex gap-3">
				<div class="flex-1">
					<label for="category" class="block text-sm font-medium text-gray-700 mb-1">
						Catégorie <span class="text-red-500">*</span>
					</label>
					<select
						id="category"
						bind:value={selectedCategoryId}
						onchange={() => { selectedSectionId = '' }}
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
					>
						<option value="">— choisir —</option>
						{#each data.categories as cat}
							<option value={String(cat.id)}>{cat.displayName}</option>
						{/each}
					</select>
				</div>
				<div class="flex-1">
					<label for="sectionId" class="block text-sm font-medium text-gray-700 mb-1">
						Section <span class="text-red-500">*</span>
					</label>
					<select
						id="sectionId"
						name="sectionId"
						bind:value={selectedSectionId}
						disabled={!selectedCategoryId}
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400 {errors.sectionId ? 'border-red-400' : ''}"
					>
						<option value="">— choisir —</option>
						{#each visibleSections as sec}
							<option value={String(sec.id)}>{sec.displayName}</option>
						{/each}
					</select>
					{#if errors.sectionId}<p class="mt-1 text-xs text-red-600">{errors.sectionId[0]}</p>{/if}
				</div>
			</div>

			<!-- Supports applicables -->
			<div>
				<fieldset>
					<legend class="block text-sm font-medium text-gray-700 mb-2">
						Supports applicables <span class="text-red-500">*</span>
					</legend>
					<div class="flex gap-5">
						{#each supports as s}
							<label class="flex items-center gap-1.5 text-sm text-gray-600">
								<input
									type="checkbox"
									name="applicableSupports"
									value={s.value}
									checked={checkedSupports.includes(s.value)}
									onchange={(e) => {
										if (e.currentTarget.checked) {
											checkedSupports = [...checkedSupports, s.value]
										} else {
											checkedSupports = checkedSupports.filter((x) => x !== s.value)
										}
									}}
								/>
								{s.label}
							</label>
						{/each}
					</div>
					{#if errors.applicableSupports}<p class="mt-1 text-xs text-red-600">{errors.applicableSupports[0]}</p>{/if}
				</fieldset>
			</div>

			<!-- Énoncé -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="questionMd" class="block text-sm font-medium text-gray-700">
						Énoncé <span class="text-red-500">*</span>
					</label>
					<button type="button" onclick={() => markdownHelpDialog?.showModal()} class="text-xs text-gray-400 hover:text-gray-600">? Aide markdown</button>
				</div>
				<div class="border rounded-md {errors.questionMd ? 'border-red-400' : 'border-gray-200'}">
					<div class="lg:grid lg:grid-cols-2 lg:gap-0">
						<textarea
							id="questionMd"
							name="questionMd"
							bind:value={questionMd}
							rows="10"
							class="w-full resize-none border-0 lg:border-r border-gray-200 p-3 font-mono text-sm focus:outline-none rounded-l-md"
							placeholder="Énoncé en markdown…"
						></textarea>
						<div class="hidden lg:block prose prose-sm max-w-none p-3 text-sm">
							{@html questionPreview}
						</div>
					</div>
					<details class="lg:hidden border-t border-gray-200">
						<summary class="cursor-pointer px-3 py-2 text-xs text-gray-400 hover:text-gray-600 select-none">Aperçu</summary>
						<div class="prose prose-sm max-w-none p-3 text-sm">
							{@html questionPreview}
						</div>
					</details>
				</div>
				{#if errors.questionMd}<p class="mt-1 text-xs text-red-600">{errors.questionMd[0]}</p>{/if}
			</div>

			<!-- Correction -->
			<div>
				<div class="flex items-center justify-between mb-1">
					<label for="correctionMd" class="block text-sm font-medium text-gray-700">
						Correction <span class="text-red-500">*</span>
					</label>
					<button type="button" onclick={() => markdownHelpDialog?.showModal()} class="text-xs text-gray-400 hover:text-gray-600">? Aide markdown</button>
				</div>
				<div class="border rounded-md {errors.correctionMd ? 'border-red-400' : 'border-gray-200'}">
					<div class="lg:grid lg:grid-cols-2 lg:gap-0">
						<textarea
							id="correctionMd"
							name="correctionMd"
							bind:value={correctionMd}
							rows="10"
							class="w-full resize-none border-0 lg:border-r border-gray-200 p-3 font-mono text-sm focus:outline-none rounded-l-md"
							placeholder="Correction en markdown…"
						></textarea>
						<div class="hidden lg:block prose prose-sm max-w-none p-3 text-sm">
							{@html correctionPreview}
						</div>
					</div>
					<details class="lg:hidden border-t border-gray-200">
						<summary class="cursor-pointer px-3 py-2 text-xs text-gray-400 hover:text-gray-600 select-none">Aperçu</summary>
						<div class="prose prose-sm max-w-none p-3 text-sm">
							{@html correctionPreview}
						</div>
					</details>
				</div>
				{#if errors.correctionMd}<p class="mt-1 text-xs text-red-600">{errors.correctionMd[0]}</p>{/if}
			</div>

			<!-- Identité -->
			<div>
				<p class="text-sm font-medium text-gray-700 mb-3">Vos coordonnées</p>
				<p class="text-xs text-gray-400 mb-3">Ces informations seront utilisées pour vous contacter si nous avons des questions sur votre proposition, et pour vous mentionner dans les contributeurs si elle est acceptée.</p>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="submitterName" class="block text-sm font-medium text-gray-700 mb-1">
						Nom / Prénom <span class="text-red-500">*</span>
					</label>
					<input
						id="submitterName"
						name="submitterName"
						type="text"
						maxlength="100"
						bind:value={submitterName}
						class="w-full rounded-md border px-3 py-2 text-sm {errors.submitterName ? 'border-red-400' : 'border-gray-300'}"
					/>
					{#if errors.submitterName}<p class="mt-1 text-xs text-red-600">{errors.submitterName[0]}</p>{/if}
				</div>
				<div>
					<label for="submitterEmail" class="block text-sm font-medium text-gray-700 mb-1">
						Email <span class="text-red-500">*</span>
					</label>
					<input
						id="submitterEmail"
						name="submitterEmail"
						type="email"
						bind:value={submitterEmail}
						class="w-full rounded-md border px-3 py-2 text-sm {errors.submitterEmail ? 'border-red-400' : 'border-gray-300'}"
					/>
					{#if errors.submitterEmail}<p class="mt-1 text-xs text-red-600">{errors.submitterEmail[0]}</p>{/if}
				</div>
			</div>
			</div>

			<div class="flex justify-end pt-2">
				<button
					type="submit"
					class="rounded-md bg-yellow-400 hover:bg-yellow-500 px-6 py-2 text-sm font-medium text-gray-900"
				>
					Envoyer ma proposition
				</button>
			</div>
		</form>
		</div>
	{/if}
</div>
</div>

<MarkdownHelpDialog bind:dialog={markdownHelpDialog} />
