<script lang="ts">
	import { goto } from '$app/navigation'
	import { evaluationStore } from '$lib/stores/evaluation'
	import { marked } from 'marked'

	const evaluation = $derived($evaluationStore)

	let showCorrection = $state(false)
	let showCategoryTitles = $state(true)

	$effect(() => {
		if (!evaluation) goto('/')
	})

	function renderMd(md: string): string {
		return marked(md) as string
	}
</script>

{#if evaluation}
	<div class="mx-auto max-w-3xl px-4 py-10 print:px-0 print:py-0">
		<header class="mb-8 print:hidden">
			<h1 class="mb-4 text-2xl font-bold capitalize">
				Évaluation {evaluation.support} — {evaluation.format}
			</h1>
			<div class="flex flex-wrap gap-4">
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={showCorrection} class="h-4 w-4" />
					Afficher la correction
				</label>
				<label class="flex cursor-pointer items-center gap-2 text-sm">
					<input type="checkbox" bind:checked={showCategoryTitles} class="h-4 w-4" />
					Titres de catégories
				</label>
			</div>
		</header>

		{#each evaluation.slots as slot, i}
			{@const prevSlot = i > 0 ? evaluation.slots[i - 1] : null}
			{@const newCategory = !prevSlot || prevSlot.categoryId !== slot.categoryId}

			{#if newCategory && showCategoryTitles}
				<h2 class="mt-10 mb-4 border-b-2 border-gray-800 pb-1 text-lg font-bold uppercase tracking-wide print:mt-6">
					{slot.categoryDisplayName}
				</h2>
			{/if}

			<section class="mb-6">
				<h3 class="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
					{slot.sectionDisplayName}
				</h3>

				{#each slot.questions as question}
					<article class="mb-6 break-inside-avoid rounded-lg border border-gray-200 p-5 print:rounded-none print:border-0 print:border-b print:p-3">
						<p class="mb-3 font-medium">{question.title}</p>
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<div class="prose prose-sm max-w-none">{@html renderMd(question.questionMd)}</div>
						{#if showCorrection && question.correctionMd}
							<div class="mt-4 border-t border-gray-200 pt-4">
								<p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Correction</p>
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								<div class="prose prose-sm max-w-none">{@html renderMd(question.correctionMd)}</div>
							</div>
						{/if}
					</article>
				{/each}
			</section>
		{/each}
	</div>
{/if}
