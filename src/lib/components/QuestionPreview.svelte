<script lang="ts">
	import { createMarkdownRenderer } from '$lib/markdown'

	type Props = {
		questionId: number
		title: string
		categoryDisplayName: string
		sectionDisplayName: string
		difficulty: string
		applicableSupports: string[]
		questionMd: string
		correctionMd: string
		sourceMd?: string | null
		r2BaseUrl: string
		onclose?: () => void
	}

	let {
		questionId,
		title,
		categoryDisplayName,
		sectionDisplayName,
		difficulty,
		applicableSupports,
		questionMd,
		correctionMd,
		sourceMd,
		r2BaseUrl,
		onclose
	}: Props = $props()

	function renderMd(md: string) {
		return createMarkdownRenderer(questionId, r2BaseUrl)(md)
	}
</script>

<div class="mb-4 flex items-start justify-between gap-2">
	<h2 class="text-base font-semibold text-gray-900">{title}</h2>
	{#if onclose}
		<button
			type="button"
			onclick={onclose}
			class="shrink-0 text-gray-400 hover:text-gray-700"
			aria-label="Fermer"
		>✕</button>
	{/if}
</div>

<div class="mb-3 flex flex-wrap gap-2 text-xs text-gray-500">
	<span>{categoryDisplayName} / {sectionDisplayName}</span>
	<span>·</span>
	<span>{difficulty}</span>
	<span>·</span>
	<span>{applicableSupports.length === 0 ? 'tous supports' : applicableSupports.join(', ')}</span>
</div>

<div class="prose prose-sm max-h-[35vh] overflow-y-auto">
	{@html renderMd(questionMd)}
</div>

<hr class="my-4 border-gray-200" />

<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Correction</p>
<div class="prose prose-sm max-h-[25vh] overflow-y-auto">
	{@html renderMd(correctionMd)}
</div>

{#if sourceMd}
	<p class="mt-4 text-xs text-gray-400">Source : {sourceMd}</p>
{/if}
