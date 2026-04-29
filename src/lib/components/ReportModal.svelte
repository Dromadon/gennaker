<script lang="ts">
	import { tick } from 'svelte'

	type Props = {
		open: boolean
		questionId: number
		questionTitle: string
		onclose: () => void
		onsuccess: () => void
	}

	let { open, questionId, questionTitle, onclose, onsuccess }: Props = $props()

	let dialog = $state<HTMLDialogElement | null>(null)
	let problemType = $state('')
	let description = $state('')
	let email = $state('')
	let honeypot = $state('')
	let submitting = $state(false)
	let errorMsg = $state('')

	const PROBLEM_TYPES = [
		{ value: 'enonce_incorrect', label: 'Énoncé incorrect' },
		{ value: 'correction_incorrecte', label: 'Correction incorrecte' },
		{ value: 'question_doublon', label: 'Question en doublon' },
		{ value: 'mise_en_forme', label: 'Problème de mise en forme' },
		{ value: 'autre', label: 'Autre' }
	]

	$effect(() => {
		if (open) {
			problemType = ''
			description = ''
			email = ''
			honeypot = ''
			errorMsg = ''
			tick().then(() => {
				if (!dialog?.open) dialog?.showModal()
			})
		} else {
			if (dialog?.open) dialog.close()
		}
	})

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === dialog) onclose()
	}

	async function submit() {
		if (!problemType) {
			errorMsg = 'Veuillez sélectionner un type de problème.'
			return
		}
		if (!description.trim()) {
			errorMsg = 'Veuillez décrire le problème.'
			return
		}
		submitting = true
		errorMsg = ''
		try {
			const res = await fetch(`/api/questions/${questionId}/report`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					problemType,
					description: description.trim(),
					email: email.trim() || null,
					honeypot
				})
			})
			if (res.status === 429) {
				errorMsg = 'Trop de signalements envoyés. Réessayez plus tard.'
			} else if (!res.ok) {
				errorMsg = 'Une erreur est survenue. Réessayez.'
			} else {
				onsuccess()
				onclose()
			}
		} catch {
			errorMsg = 'Erreur réseau.'
		} finally {
			submitting = false
		}
	}
</script>

<!-- Honeypot — invisible pour les humains, rempli par certains bots -->
<input
	type="text"
	bind:value={honeypot}
	aria-hidden="true"
	tabindex="-1"
	autocomplete="off"
	style="display:none"
/>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onclose()}
	class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-lg p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
>
	<!-- En-tête -->
	<div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
		<h2 class="text-base font-semibold text-gray-900">Signaler un problème</h2>
		<button
			onclick={onclose}
			class="rounded-md p-1 text-gray-400 hover:text-gray-700"
			aria-label="Fermer"
		>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Corps -->
	<div class="px-5 py-4 space-y-4">
		<!-- Question concernée (lecture seule) -->
		<div>
			<p class="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">Question</p>
			<p class="text-sm text-gray-700 rounded-md bg-gray-50 px-3 py-2 border border-gray-200">
				{questionTitle}
			</p>
		</div>

		<!-- Type de problème -->
		<div>
			<label for="report-type" class="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
				Type de problème <span class="text-red-500">*</span>
			</label>
			<select
				id="report-type"
				bind:value={problemType}
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			>
				<option value="" disabled>Choisir…</option>
				{#each PROBLEM_TYPES as pt}
					<option value={pt.value}>{pt.label}</option>
				{/each}
			</select>
		</div>

		<!-- Description obligatoire -->
		<div>
			<label for="report-desc" class="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
				Description <span class="text-red-500">*</span>
			</label>
			<textarea
				id="report-desc"
				bind:value={description}
				maxlength={500}
				rows={3}
				placeholder="Décrivez le problème…"
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
			></textarea>
			<p class="text-right text-xs text-gray-400 mt-0.5">{description.length}/500</p>
		</div>

		<!-- Email de contact (optionnel) -->
		<div>
			<label for="report-email" class="block text-xs font-medium uppercase tracking-wide text-gray-500 mb-1">
				Email de contact <span class="text-gray-400 font-normal normal-case">(optionnel)</span>
			</label>
			<input
				id="report-email"
				type="email"
				bind:value={email}
				placeholder="votre@email.com"
				class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
			/>
		</div>

		{#if errorMsg}
			<p class="text-sm text-red-600">{errorMsg}</p>
		{/if}
	</div>

	<!-- Actions -->
	<div class="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
		<button
			onclick={onclose}
			type="button"
			class="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900"
		>
			Annuler
		</button>
		<button
			onclick={submit}
			type="button"
			disabled={submitting}
			class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
		>
			{submitting ? 'Envoi…' : 'Envoyer'}
		</button>
	</div>
</dialog>
