<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import QuestionForm from '$lib/components/QuestionForm.svelte'

	let { data, form }: { data: PageData; form: ActionData } = $props()
</script>

<div class="mb-6">
	<a href="/admin/questions" class="text-sm text-gray-500 hover:text-gray-900">← Questions</a>
	<h1 class="mt-2 text-xl font-semibold text-gray-900">Nouvelle question</h1>
</div>

{#if form?.errors}
	<div class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
		Certains champs sont invalides. Corrige les erreurs ci-dessous.
	</div>
{/if}

<div class="rounded-lg border border-gray-200 bg-white p-6">
	<QuestionForm
		categories={data.categories}
		errors={form?.errors ?? {}}
		action="?/create"
	/>
</div>
