<script lang="ts">
	import { goto } from '$app/navigation'
	import { evaluationStore } from '$lib/stores/evaluation'
	import type { Evaluation } from '$lib/domain/types'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	let selectedSupport = $state(data.activeSupports[0]?.value ?? '')
	let selectedFormat = $state(data.formats[0].value)
	let loading = $state(false)
	let errorMessage = $state('')

	async function generate() {
		if (!selectedSupport || !selectedFormat) return
		loading = true
		errorMessage = ''

		try {
			const res = await fetch(
				`/api/evaluation/generate?support=${selectedSupport}&format=${selectedFormat}`
			)
			if (!res.ok) {
				const text = await res.text()
				errorMessage = text || 'Erreur lors de la génération'
				return
			}
			const evaluation = (await res.json()) as Evaluation
			evaluationStore.set(evaluation)
			goto('/evaluation')
		} catch {
			errorMessage = 'Erreur réseau, veuillez réessayer'
		} finally {
			loading = false
		}
	}
</script>

<main class="mx-auto max-w-lg px-4 py-16">
	<h1 class="mb-2 text-3xl font-bold">Gennaker</h1>
	<p class="mb-10 text-gray-600">Générez une évaluation théorique pour votre formation voile.</p>

	<form onsubmit={(e) => { e.preventDefault(); generate() }} class="space-y-6">
		<fieldset>
			<legend class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
				Support
			</legend>
			<div class="flex flex-wrap gap-3">
				{#each data.activeSupports as s}
					<label class="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 transition-colors {selectedSupport === s.value ? 'border-blue-600 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 hover:border-gray-400'}">
						<input type="radio" bind:group={selectedSupport} value={s.value} class="sr-only" />
						{s.label}
					</label>
				{/each}
			</div>
		</fieldset>

		<fieldset>
			<legend class="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
				Format
			</legend>
			<div class="flex flex-col gap-2">
				{#each data.formats as f}
					<label class="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors {selectedFormat === f.value ? 'border-blue-600 bg-blue-50 font-medium text-blue-700' : 'border-gray-200 hover:border-gray-400'}">
						<input type="radio" bind:group={selectedFormat} value={f.value} class="sr-only" />
						{f.label}
					</label>
				{/each}
			</div>
		</fieldset>

		{#if errorMessage}
			<p class="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
		{/if}

		<button
			type="submit"
			disabled={loading || !selectedSupport}
			class="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
		>
			{loading ? 'Génération…' : 'Générer une évaluation'}
		</button>
	</form>

	<p class="mt-8 text-center text-sm text-gray-400">
		<a href="/questions" class="hover:text-gray-600 hover:underline">Consulter la banque de questions</a>
		<span class="mx-2 text-gray-200">·</span>
		<a href="/soumettre" class="hover:text-gray-600 hover:underline">Proposer une question</a>
	</p>
</main>
