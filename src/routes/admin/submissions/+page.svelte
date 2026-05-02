<script lang="ts">
	import { page } from '$app/state'
	import { enhance } from '$app/forms'
	import type { PageData, ActionData } from './$types'
	import type { SubmissionAdminRow, SubmissionStatus } from '$lib/server/db/queries/submissions'
	import QuestionPreview from '$lib/components/QuestionPreview.svelte'

	let { data, form }: { data: PageData; form: ActionData } = $props()

	let toastMessage = $state<string | null>(null)
	let toastTimer: ReturnType<typeof setTimeout> | null = null

	$effect(() => {
		if (form?.approved || form?.rejected) {
			if (toastTimer) clearTimeout(toastTimer)
			toastMessage = form.approved ? 'Soumission approuvée.' : 'Soumission rejetée.'
			toastTimer = setTimeout(() => (toastMessage = null), 4000)
		}
	})

	const PAGE_SIZE = 20

	const STATUS_LABELS: Record<SubmissionStatus, string> = {
		en_attente: 'En attente',
		approuve: 'Approuvé',
		rejete: 'Rejeté'
	}

	const STATUS_BADGE: Record<SubmissionStatus, string> = {
		en_attente: 'bg-yellow-100 text-yellow-700',
		approuve: 'bg-green-100 text-green-700',
		rejete: 'bg-red-100 text-red-700'
	}

	let selectedId = $state<number | null>(null)
	const selectedSubmission = $derived(
		selectedId !== null ? (data.rows.find((r) => r.id === selectedId) ?? null) : null
	)
	let rejectionNote = $state('')

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	function truncate(s: string, max = 60): string {
		return s.length > max ? s.slice(0, max) + '…' : s
	}

	const totalPages = $derived(Math.ceil(data.total / PAGE_SIZE))

	function statusUrl(status: string | null): string {
		const u = new URL('/admin/submissions', 'http://x')
		if (status) u.searchParams.set('status', status)
		return u.pathname + u.search
	}

	function pageUrl(p: number): string {
		const u = new URL('/admin/submissions', 'http://x')
		if (data.statusFilter) u.searchParams.set('status', data.statusFilter)
		u.searchParams.set('page', String(p))
		return u.pathname + u.search
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold text-gray-900">Soumissions</h1>
		<span class="text-sm text-gray-500">{data.total} soumission{data.total > 1 ? 's' : ''}</span>
	</div>

	<!-- Filtres statut -->
	<div class="flex gap-2">
		<a
			href={statusUrl(null)}
			class="rounded-md border px-3 py-1.5 text-sm transition-colors {!data.statusFilter
				? 'border-gray-900 bg-gray-900 text-white'
				: 'border-gray-200 text-gray-600 hover:border-gray-400'}"
		>
			Tous
		</a>
		{#each Object.entries(STATUS_LABELS) as [value, label]}
			<a
				href={statusUrl(value)}
				class="rounded-md border px-3 py-1.5 text-sm transition-colors {data.statusFilter === value
					? 'border-gray-900 bg-gray-900 text-white'
					: 'border-gray-200 text-gray-600 hover:border-gray-400'}"
			>
				{label}
			</a>
		{/each}
	</div>

	<div class="lg:flex lg:gap-6">
	<!-- Colonne principale -->
	<div class="min-w-0 transition-all duration-300 {selectedSubmission ? 'lg:w-96 lg:shrink-0' : 'flex-1'} overflow-hidden space-y-6">
		<!-- Tableau -->
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
					<tr>
						<th class="px-4 py-3 text-left">Titre</th>
						{#if !selectedSubmission}
							<th class="px-4 py-3 text-left">Section</th>
							<th class="px-4 py-3 text-left">Soumis par</th>
							<th class="px-4 py-3 text-left">Date</th>
							<th class="px-4 py-3 text-left">Statut</th>
						{/if}
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.rows as submission}
						<tr
							class="cursor-pointer hover:bg-gray-50 {selectedSubmission?.id === submission.id ? 'bg-blue-50 hover:bg-blue-50' : ''}"
							onclick={() => {
								selectedId = submission.id
								rejectionNote = ''
							}}
						>
							<td class="px-4 py-3">
								<span class="font-medium text-gray-900">{truncate(submission.title)}</span>
								{#if selectedSubmission?.id === submission.id}
									<span class="ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[submission.status]}">
										{STATUS_LABELS[submission.status]}
									</span>
								{/if}
							</td>
							{#if !selectedSubmission}
								<td class="px-4 py-3 text-gray-600">
									{submission.categoryDisplayName} / {submission.sectionDisplayName}
								</td>
								<td class="px-4 py-3 text-gray-600">
									{submission.submitterName}
								</td>
								<td class="px-4 py-3 text-gray-500 whitespace-nowrap">
									{formatDate(submission.createdAt)}
								</td>
								<td class="px-4 py-3">
									<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[submission.status]}">
										{STATUS_LABELS[submission.status]}
									</span>
								</td>
							{/if}
						</tr>
					{:else}
						<tr>
							<td colspan={selectedSubmission ? 1 : 5} class="px-4 py-8 text-center text-sm text-gray-400">
								Aucune soumission.
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex items-center justify-between text-sm text-gray-500">
				<span>Page {data.page} / {totalPages}</span>
				<div class="flex gap-2">
					{#if data.page > 1}
						<a href={pageUrl(data.page - 1)} class="rounded border border-gray-200 px-3 py-1 hover:border-gray-400">
							← Précédent
						</a>
					{/if}
					{#if data.page < totalPages}
						<a href={pageUrl(data.page + 1)} class="rounded border border-gray-200 px-3 py-1 hover:border-gray-400">
							Suivant →
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Panneau de prévisualisation desktop -->
	{#if selectedSubmission}
		<div class="hidden lg:block lg:min-w-0 lg:flex-1">
			<div class="sticky top-4 rounded-lg border border-gray-200 bg-white p-5 space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Détail de la soumission</h2>
					<button
						type="button"
						onclick={() => { selectedId = null }}
						class="text-gray-400 hover:text-gray-700"
						aria-label="Fermer"
					>✕</button>
				</div>

				<!-- Métadonnées -->
				<div class="space-y-2 text-sm">
					<div>
						<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Soumis par</span>
						<p class="text-gray-700">{selectedSubmission.submitterName} — <a href="mailto:{selectedSubmission.submitterEmail}" class="text-blue-600 hover:underline">{selectedSubmission.submitterEmail}</a></p>
					</div>
					<div>
						<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Date</span>
						<p class="text-gray-700">{formatDate(selectedSubmission.createdAt)}</p>
					</div>
					<div>
						<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Statut</span>
						<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[selectedSubmission.status]}">
							{STATUS_LABELS[selectedSubmission.status]}
						</span>
					</div>
					{#if selectedSubmission.status === 'rejete' && selectedSubmission.rejectionNote}
						<div>
							<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Note de rejet</span>
							<p class="text-gray-700 whitespace-pre-wrap">{selectedSubmission.rejectionNote}</p>
						</div>
					{/if}
				</div>

				<hr class="border-gray-200" />

				<QuestionPreview
					questionId={0}
					title={selectedSubmission.title}
					categoryDisplayName={selectedSubmission.categoryDisplayName}
					sectionDisplayName={selectedSubmission.sectionDisplayName}
					difficulty="—"
					applicableSupports={JSON.parse(selectedSubmission.applicableSupports)}
					questionMd={selectedSubmission.questionMd}
					correctionMd={selectedSubmission.correctionMd}
					r2BaseUrl={page.data.r2BaseUrl}
				/>

				<!-- Actions -->
				{#if selectedSubmission.status === 'en_attente'}
					<div class="space-y-3 border-t border-gray-100 pt-3">
						<form method="POST" action="?/approve" use:enhance>
							<input type="hidden" name="id" value={selectedSubmission.id} />
							<button
								type="submit"
								class="w-full rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:border-green-500 hover:bg-green-100"
							>
								Approuver — créer en brouillon
							</button>
						</form>

						<form method="POST" action="?/reject" use:enhance class="space-y-2">
							<input type="hidden" name="id" value={selectedSubmission.id} />
							<textarea
								name="rejectionNote"
								bind:value={rejectionNote}
								placeholder="Note de rejet (optionnelle, max 300 caractères)"
								maxlength="300"
								rows="2"
								class="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none resize-none"
							></textarea>
							<button
								type="submit"
								class="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:border-red-400 hover:bg-red-100"
							>
								Rejeter
							</button>
						</form>
					</div>
				{/if}

				<!-- Lien vers la question créée -->
				{#if selectedSubmission.status === 'approuve' && selectedSubmission.approvedQuestionId}
					<div class="border-t border-gray-100 pt-3">
						<a
							href="/admin/questions/{selectedSubmission.approvedQuestionId}/edit"
							class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-100"
						>
							Voir dans l'admin questions →
						</a>
					</div>
				{/if}
			</div>
		</div>
	{/if}
	</div>
</div>

<!-- Pop-up plein écran mobile -->
{#if selectedSubmission}
	<div class="fixed inset-0 z-50 flex flex-col bg-white lg:hidden">
		<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
			<h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Détail de la soumission</h2>
			<button
				type="button"
				onclick={() => { selectedId = null }}
				class="ml-2 shrink-0 text-gray-400 hover:text-gray-700"
				aria-label="Fermer"
			>✕ Fermer</button>
		</div>
		<div class="flex-1 overflow-y-auto p-5 space-y-4">
			<!-- Métadonnées -->
			<div class="space-y-2 text-sm">
				<div>
					<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Soumis par</span>
					<p class="text-gray-700">{selectedSubmission.submitterName} — <a href="mailto:{selectedSubmission.submitterEmail}" class="text-blue-600 hover:underline">{selectedSubmission.submitterEmail}</a></p>
				</div>
				<div>
					<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Date</span>
					<p class="text-gray-700">{formatDate(selectedSubmission.createdAt)}</p>
				</div>
				<div>
					<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Statut</span>
					<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[selectedSubmission.status]}">
						{STATUS_LABELS[selectedSubmission.status]}
					</span>
				</div>
				{#if selectedSubmission.status === 'rejete' && selectedSubmission.rejectionNote}
					<div>
						<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Note de rejet</span>
						<p class="text-gray-700 whitespace-pre-wrap">{selectedSubmission.rejectionNote}</p>
					</div>
				{/if}
			</div>

			<hr class="border-gray-200" />

			<QuestionPreview
				questionId={0}
				title={selectedSubmission.title}
				categoryDisplayName={selectedSubmission.categoryDisplayName}
				sectionDisplayName={selectedSubmission.sectionDisplayName}
				difficulty="—"
				applicableSupports={JSON.parse(selectedSubmission.applicableSupports)}
				questionMd={selectedSubmission.questionMd}
				correctionMd={selectedSubmission.correctionMd}
				r2BaseUrl={page.data.r2BaseUrl}
			/>

			<!-- Actions -->
			{#if selectedSubmission.status === 'en_attente'}
				<div class="space-y-3 border-t border-gray-100 pt-3">
					<form method="POST" action="?/approve" use:enhance>
						<input type="hidden" name="id" value={selectedSubmission.id} />
						<button
							type="submit"
							class="w-full rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:border-green-500 hover:bg-green-100"
						>
							Approuver — créer en brouillon
						</button>
					</form>

					<form method="POST" action="?/reject" use:enhance class="space-y-2">
						<input type="hidden" name="id" value={selectedSubmission.id} />
						<textarea
							name="rejectionNote"
							bind:value={rejectionNote}
							placeholder="Note de rejet (optionnelle, max 300 caractères)"
							maxlength="300"
							rows="2"
							class="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none resize-none"
						></textarea>
						<button
							type="submit"
							class="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:border-red-400 hover:bg-red-100"
						>
							Rejeter
						</button>
					</form>
				</div>
			{/if}

			<!-- Lien vers la question créée -->
			{#if selectedSubmission.status === 'approuve' && selectedSubmission.approvedQuestionId}
				<div class="border-t border-gray-100 pt-3">
					<a
						href="/admin/questions/{selectedSubmission.approvedQuestionId}/edit"
						class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-100"
					>
						Voir dans l'admin questions →
					</a>
				</div>
			{/if}

		</div>
	</div>
{/if}

{#if toastMessage}
	<div class="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
		<span>{toastMessage}</span>
		<button onclick={() => (toastMessage = null)} class="text-gray-400 hover:text-white" aria-label="Fermer">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{/if}
