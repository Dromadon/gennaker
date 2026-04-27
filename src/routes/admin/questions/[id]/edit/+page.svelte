<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import QuestionForm from '$lib/components/QuestionForm.svelte'

	let { data, form }: { data: PageData; form: ActionData } = $props()

	let deleteDialog: HTMLDialogElement
</script>

<div class="mb-6 flex items-start justify-between">
	<div>
		<a href="/admin/questions" class="text-sm text-gray-500 hover:text-gray-900">← Questions</a>
		<h1 class="mt-2 text-xl font-semibold text-gray-900">Modifier la question #{data.question.id}</h1>
	</div>
	<button
		type="button"
		onclick={() => deleteDialog.showModal()}
		class="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
	>
		Supprimer
	</button>
</div>

{#if form?.updated}
	<div class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">Question mise à jour.</div>
{/if}

{#if form?.errors}
	<div class="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
		Certains champs sont invalides. Corrige les erreurs ci-dessous.
	</div>
{/if}

<div class="rounded-lg border border-gray-200 bg-white p-6">
	<QuestionForm
		categories={data.categories}
		question={data.question}
		errors={form?.errors ?? {}}
		action="?/update"
	/>
</div>

<!-- Dialog suppression -->
<dialog bind:this={deleteDialog} class="rounded-lg p-6 shadow-xl backdrop:bg-black/40 max-w-sm w-full">
	<h2 class="mb-2 text-base font-semibold text-gray-900">Supprimer cette question ?</h2>
	<p class="mb-6 text-sm text-gray-500">
		La question #{data.question.id} « {data.question.title} » sera définitivement supprimée.
	</p>
	<div class="flex justify-end gap-3">
		<button
			type="button"
			onclick={() => deleteDialog.close()}
			class="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
		>
			Annuler
		</button>
		<form method="POST" action="?/delete">
			<button
				type="submit"
				class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
			>
				Supprimer
			</button>
		</form>
	</div>
</dialog>
