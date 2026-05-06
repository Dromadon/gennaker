<script lang="ts">
	import { tick } from 'svelte'

	type Props = {
		open: boolean
		url: string
		onclose: () => void
	}

	let { open, url, onclose }: Props = $props()

	let dialog = $state<HTMLDialogElement | null>(null)
	let copied = $state(false)
	let copyTimer: ReturnType<typeof setTimeout> | null = null

	const fullUrl = $derived(
		typeof window !== 'undefined' ? window.location.origin + url : url
	)

	$effect(() => {
		if (open) {
			copied = false
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

	async function copyLink() {
		try {
			await navigator.clipboard.writeText(fullUrl)
			if (copyTimer) clearTimeout(copyTimer)
			copied = true
			copyTimer = setTimeout(() => (copied = false), 2000)
		} catch {
			// Fallback : sélectionner le texte de l'input
			const input = dialog?.querySelector('input')
			input?.select()
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog
	bind:this={dialog}
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onclose()}
	class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-lg p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
>
	<!-- En-tête -->
	<div class="flex items-center justify-between border-b border-gray-200 px-5 py-4">
		<h2 class="text-base font-semibold text-gray-900">Partager cette évaluation</h2>
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
		<div class="flex gap-2">
			<input
				type="text"
				readonly
				value={fullUrl}
				class="flex-1 min-w-0 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:outline-none"
			/>
			<button
				onclick={copyLink}
				class="shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition-colors {copied ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900'}"
			>
				{copied ? 'Copié !' : 'Copier le lien'}
			</button>
		</div>

		<p class="text-sm text-gray-500">
			Ce lien est valable <strong>30 jours</strong>. Les modifications apportées à l'évaluation après le partage (re-tirages, sélections manuelles) ne sont pas répercutées sur ce lien.
		</p>
	</div>

	<!-- Actions -->
	<div class="flex justify-end border-t border-gray-200 px-5 py-3">
		<button
			onclick={onclose}
			type="button"
			class="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900"
		>
			Fermer
		</button>
	</div>
</dialog>
