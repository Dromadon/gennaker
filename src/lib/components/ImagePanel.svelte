<script lang="ts">
	import { extractImageRefs } from '$lib/markdown'
	import { sanitizeFilename } from '$lib/images'

	type PendingImage = { file: File; objectUrl: string }

	type Props = {
		existingImages: string[]
		questionId: number | undefined
		r2BaseUrl: string
		questionMd: string
		correctionMd: string
		lastFocusedField: 'question' | 'correction'
		questionTextarea: HTMLTextAreaElement | undefined
		correctionTextarea: HTMLTextAreaElement | undefined
		pendingImages?: Map<string, PendingImage>
	}

	let {
		existingImages,
		questionId,
		r2BaseUrl,
		questionMd = $bindable(),
		correctionMd = $bindable(),
		lastFocusedField,
		questionTextarea,
		correctionTextarea,
		pendingImages = $bindable(new Map<string, PendingImage>())
	}: Props = $props()

	let fileInput: HTMLInputElement
	let overwriteWarning = $state<string | null>(null)
	let pendingFileToConfirm = $state<File | null>(null)

	const currentImageRefs = $derived(
		new Set([...extractImageRefs(questionMd), ...extractImageRefs(correctionMd)])
	)

	const pendingImageNames = $derived([...pendingImages.keys()])

	function thumbnailSrc(filename: string): string {
		const pending = pendingImages.get(filename)
		if (pending) return pending.objectUrl
		if (questionId) return `${r2BaseUrl}/${questionId}/images/${filename}`
		return ''
	}

	function addPendingImage(filename: string, file: File) {
		const existing = pendingImages.get(filename)
		if (existing) URL.revokeObjectURL(existing.objectUrl)
		pendingImages = new Map(pendingImages).set(filename, {
			file,
			objectUrl: URL.createObjectURL(file)
		})
	}

	function onFileSelected(e: Event) {
		const input = e.currentTarget as HTMLInputElement
		const file = input.files?.[0]
		if (!file) return
		const filename = sanitizeFilename(file.name)
		input.value = ''
		if (existingImages.includes(filename)) {
			overwriteWarning = filename
			pendingFileToConfirm = file
			return
		}
		addPendingImage(filename, file)
	}

	function escapeRegex(s: string) {
		return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
	}

	function removeImageRef(filename: string) {
		const pattern = new RegExp(`!\\[.*?\\]\\(images\\/${escapeRegex(filename)}\\)`, 'g')
		questionMd = questionMd.replace(pattern, '')
		correctionMd = correctionMd.replace(pattern, '')
	}

	function insertImage(filename: string) {
		const alt = lastFocusedField === 'question' ? 'image_question' : 'image_correction'
		const md = `![${alt}](images/${filename})`
		const textarea = lastFocusedField === 'question' ? questionTextarea : correctionTextarea
		if (!textarea) return

		const start = textarea.selectionStart ?? textarea.value.length
		const end = textarea.selectionEnd ?? start
		const before = textarea.value.slice(0, start)
		const after = textarea.value.slice(end)
		const newValue = before + md + after

		if (lastFocusedField === 'question') {
			questionMd = newValue
		} else {
			correctionMd = newValue
		}

		setTimeout(() => {
			textarea.focus()
			const pos = start + md.length
			textarea.setSelectionRange(pos, pos)
		}, 0)
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	class="hidden"
	onchange={onFileSelected}
/>

<div class="rounded-md border border-gray-200 bg-gray-50 p-3">
	<div class="flex items-center justify-between mb-2">
		<span class="text-xs font-medium text-gray-600">Images</span>
		<button
			type="button"
			onclick={() => fileInput.click()}
			class="rounded px-2 py-1 text-xs font-medium border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
		>
			+ Ajouter
		</button>
	</div>

	{#if overwriteWarning}
		<div class="mb-2 rounded-md border border-orange-200 bg-orange-50 p-2 text-xs text-orange-800">
			<p class="font-medium mb-1">« {overwriteWarning} » existe déjà.</p>
			<p class="mb-2 text-orange-700">L'image existante sera remplacée à l'enregistrement.</p>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={() => {
						addPendingImage(overwriteWarning!, pendingFileToConfirm!)
						overwriteWarning = null
						pendingFileToConfirm = null
					}}
					class="rounded px-2 py-0.5 text-xs border border-orange-300 bg-white hover:bg-orange-50 text-orange-700"
				>
					Remplacer
				</button>
				<button
					type="button"
					onclick={() => { overwriteWarning = null; pendingFileToConfirm = null }}
					class="rounded px-2 py-0.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 text-gray-600"
				>
					Annuler
				</button>
			</div>
		</div>
	{/if}

	{#if existingImages.length === 0 && pendingImageNames.length === 0}
		<p class="text-xs text-gray-400">Aucune image associée à cette question.</p>
	{:else}
		{#if existingImages.length > 0}
			<p class="mb-1 text-xs font-medium text-gray-500">Images existantes</p>
			<ul class="space-y-1">
				{#each existingImages as filename}
					{@const isInserted = currentImageRefs.has(filename)}
					<li class="flex items-center gap-2">
						<img
							src={thumbnailSrc(filename)}
							alt={filename}
							class="h-7 w-7 rounded object-cover border border-gray-200 flex-shrink-0 {!isInserted ? 'opacity-40' : ''}"
						/>
						<span
							class="flex-1 truncate text-xs max-w-[140px] {isInserted ? 'text-gray-700' : 'text-gray-400 line-through'}"
							title={filename}
						>
							{filename}
						</span>
						{#if !isInserted}
							<button
								type="button"
								onclick={() => insertImage(filename)}
								class="rounded px-2 py-0.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 flex-shrink-0"
							>
								Insérer
							</button>
						{:else}
							<button
								type="button"
								onclick={() => removeImageRef(filename)}
								class="rounded px-2 py-0.5 text-xs border border-red-200 bg-white hover:bg-red-50 text-red-500 flex-shrink-0"
							>
								Enlever
							</button>
						{/if}
					</li>
				{/each}
			</ul>
			{#if existingImages.some((f) => !currentImageRefs.has(f))}
				<p class="mt-1.5 text-xs text-gray-400">Les images enlevées seront supprimées lors de l'enregistrement.</p>
			{/if}
		{/if}

		{#if pendingImageNames.length > 0}
			{#if existingImages.length > 0}
				<div class="my-2 flex items-center gap-2">
					<hr class="flex-1 border-dashed border-gray-300" />
				</div>
			{/if}
			<p class="mb-1 text-xs font-medium text-gray-500">Images ajoutées</p>
			<ul class="space-y-1">
				{#each pendingImageNames as filename}
					{@const isInserted = currentImageRefs.has(filename)}
					<li class="flex items-center gap-2">
						<img
							src={thumbnailSrc(filename)}
							alt={filename}
							class="h-7 w-7 rounded object-cover border border-gray-200 flex-shrink-0 {!isInserted ? 'opacity-40' : ''}"
						/>
						<span
							class="flex-1 truncate text-xs max-w-[140px] {isInserted ? 'text-gray-700' : 'text-gray-400'}"
							title={filename}
						>
							{filename}
						</span>
						<span class="text-xs text-orange-400" title="En attente d'upload">●</span>
						{#if !isInserted}
							<button
								type="button"
								onclick={() => insertImage(filename)}
								class="rounded px-2 py-0.5 text-xs border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 flex-shrink-0"
							>
								Insérer
							</button>
						{:else}
							<button
								type="button"
								onclick={() => removeImageRef(filename)}
								class="rounded px-2 py-0.5 text-xs border border-red-200 bg-white hover:bg-red-50 text-red-500 flex-shrink-0"
							>
								Enlever
							</button>
						{/if}
					</li>
				{/each}
			</ul>
			{#if pendingImageNames.some((f) => !currentImageRefs.has(f))}
				<p class="mt-1.5 text-xs text-gray-400">Les nouvelles images non insérées ne seront pas enregistrées.</p>
			{/if}
		{/if}
	{/if}
</div>
