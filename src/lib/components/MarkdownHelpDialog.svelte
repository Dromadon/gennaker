<script lang="ts">
	type Props = { dialog?: HTMLDialogElement }
	let { dialog = $bindable() }: Props = $props()
</script>

<dialog
	bind:this={dialog}
	class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-lg p-6 shadow-xl backdrop:bg-black/40"
>
	<div class="mb-4 flex items-start justify-between gap-2">
		<h2 class="text-base font-semibold text-gray-900">Syntaxe markdown supportée</h2>
		<button
			type="button"
			onclick={() => dialog?.close()}
			class="shrink-0 text-gray-400 hover:text-gray-700"
			aria-label="Fermer"
		>✕</button>
	</div>

	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
				<th class="pb-2 pr-4">Syntaxe</th>
				<th class="pb-2">Résultat</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-gray-100">
			<tr>
				<td class="py-2 pr-4 font-mono text-gray-700"># Titre</td>
				<td class="py-2 text-gray-600">Titre de question (h1)</td>
			</tr>
			<tr>
				<td class="py-2 pr-4 font-mono text-gray-700">## Sous-titre</td>
				<td class="py-2 text-gray-600">Sous-section (h2)</td>
			</tr>
			<tr>
				<td class="py-2 pr-4 font-mono text-gray-700">**gras**</td>
				<td class="py-2 text-gray-600"><strong>gras</strong></td>
			</tr>
			<tr>
				<td class="py-2 pr-4 font-mono text-gray-700">*italique*</td>
				<td class="py-2 text-gray-600"><em>italique</em></td>
			</tr>
			<tr>
				<td class="py-2 pr-4 font-mono text-gray-700">- item</td>
				<td class="py-2 text-gray-600">Liste à puces</td>
			</tr>
			<tr>
				<td class="py-2 pr-4 font-mono text-gray-700">1. item</td>
				<td class="py-2 text-gray-600">Liste numérotée</td>
			</tr>
			<tr>
				<td class="py-2 pr-4 font-mono text-gray-700">![alt](images/x.png)</td>
				<td class="py-2 text-gray-600">Image (panneau images)</td>
			</tr>
		</tbody>
	</table>

	<p class="mt-4 text-xs text-gray-400">
		Un simple retour à la ligne crée un saut de ligne. Une ligne vide crée un nouveau paragraphe.
		La prévisualisation à droite de l'éditeur reflète le rendu exact sur la page d'évaluation.
	</p>
</dialog>
