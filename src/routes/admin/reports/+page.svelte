<script lang="ts">
	import { page } from '$app/state'
	import type { PageData, ActionData } from './$types'
	import type { ReportAdminRow, ReportStatus } from '$lib/server/db/queries/reports'
	import QuestionPreview from '$lib/components/QuestionPreview.svelte'

	let { data, form }: { data: PageData; form: ActionData } = $props()

	let toastVisible = $state(false)
	let toastTimer: ReturnType<typeof setTimeout> | null = null

	$effect(() => {
		if (form?.updated) {
			if (toastTimer) clearTimeout(toastTimer)
			toastVisible = true
			toastTimer = setTimeout(() => (toastVisible = false), 4000)
		}
	})

	const PAGE_SIZE = 30

	const STATUS_LABELS: Record<ReportStatus, string> = {
		nouveau: 'Nouveau',
		resolu: 'Résolu'
	}

	const PROBLEM_LABELS: Record<string, string> = {
		enonce_incorrect: 'Énoncé incorrect',
		correction_incorrecte: 'Correction incorrecte',
		question_doublon: 'Doublon',
		mise_en_forme: 'Mise en forme',
		autre: 'Autre'
	}

	const STATUS_BADGE: Record<ReportStatus, string> = {
		nouveau: 'bg-red-100 text-red-700',
		resolu: 'bg-green-100 text-green-700'
	}

	let selectedReport = $state<ReportAdminRow | null>(null)

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}

	function truncate(s: string | null, max = 80): string {
		if (!s) return '—'
		return s.length > max ? s.slice(0, max) + '…' : s
	}

	const totalPages = $derived(Math.ceil(data.total / PAGE_SIZE))

	function statusUrl(status: string | null): string {
		const u = new URL('/admin/reports', 'http://x')
		if (status) u.searchParams.set('status', status)
		return u.pathname + u.search
	}

	function pageUrl(p: number): string {
		const u = new URL('/admin/reports', 'http://x')
		if (data.statusFilter) u.searchParams.set('status', data.statusFilter)
		u.searchParams.set('page', String(p))
		return u.pathname + u.search
	}
</script>

<div class="flex gap-6">
	<!-- Colonne principale -->
	<div class="min-w-0 flex-1 space-y-6">
		<div class="flex items-center justify-between">
			<h1 class="text-xl font-semibold text-gray-900">Signalements</h1>
			<span class="text-sm text-gray-500">{data.total} signalement{data.total > 1 ? 's' : ''}</span>
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



		<!-- Tableau -->
		<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
			<table class="w-full text-sm">
				<thead class="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
					<tr>
						<th class="px-4 py-3 text-left">Question</th>
						<th class="px-4 py-3 text-left">Type</th>
						<th class="px-4 py-3 text-left">Date</th>
						<th class="px-4 py-3 text-left">Statut</th>
						<th class="px-4 py-3 text-left">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each data.rows as report}
						<tr
							class="cursor-pointer hover:bg-gray-50 {selectedReport?.id === report.id ? 'bg-blue-50 hover:bg-blue-50' : ''}"
							onclick={() => { selectedReport = report }}
						>
							<td class="px-4 py-3">
								<span class="font-medium text-gray-900">
									{truncate(report.questionTitle, 50)}
								</span>
							</td>
							<td class="px-4 py-3 text-gray-600">
								{PROBLEM_LABELS[report.problemType] ?? report.problemType}
							</td>
							<td class="px-4 py-3 text-gray-500 whitespace-nowrap">
								{formatDate(report.createdAt)}
							</td>
							<td class="px-4 py-3">
								<span class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[report.status]}">
									{STATUS_LABELS[report.status]}
								</span>
							</td>
							<td class="px-4 py-3" onclick={(e) => e.stopPropagation()}>
								<form method="POST" action="?/toggleStatus">
									<input type="hidden" name="id" value={report.id} />
									{#if report.status === 'nouveau'}
										<button
											type="submit"
											name="status"
											value="resolu"
											class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:border-green-400 hover:text-green-700"
										>
											Marquer résolu
										</button>
									{:else}
										<button
											type="submit"
											name="status"
											value="nouveau"
											class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:border-orange-400 hover:text-orange-700"
										>
											Rouvrir
										</button>
									{/if}
								</form>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="px-4 py-8 text-center text-sm text-gray-400">
								Aucun signalement.
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

	<!-- Panneau de prévisualisation -->
	{#if selectedReport}
		<div class="w-[420px] shrink-0">
			<div class="sticky top-4 rounded-lg border border-gray-200 bg-white p-5 space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wide">Détail du signalement</h2>
					<button
						type="button"
						onclick={() => { selectedReport = null }}
						class="text-gray-400 hover:text-gray-700"
						aria-label="Fermer"
					>✕</button>
				</div>

				<!-- Infos signalement -->
				<div class="space-y-2 text-sm">
					<div>
						<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Type</span>
						<p class="text-gray-700">{PROBLEM_LABELS[selectedReport.problemType] ?? selectedReport.problemType}</p>
					</div>
					{#if selectedReport.email}
						<div>
							<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Email de contact</span>
							<p class="text-gray-700">{selectedReport.email}</p>
						</div>
					{/if}
					<div>
						<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Description</span>
						<p class="text-gray-700 whitespace-pre-wrap">{selectedReport.description ?? '—'}</p>
					</div>
				</div>

				<hr class="border-gray-200" />

				<!-- Prévisualisation de la question -->
				<QuestionPreview
					questionId={selectedReport.questionId}
					title={selectedReport.questionTitle}
					categoryDisplayName={selectedReport.categoryDisplayName}
					sectionDisplayName={selectedReport.sectionDisplayName}
					difficulty={selectedReport.difficulty}
					applicableSupports={JSON.parse(selectedReport.applicableSupports)}
					questionMd={selectedReport.questionMd}
					correctionMd={selectedReport.correctionMd}
					sourceMd={selectedReport.sourceMd}
					r2BaseUrl={page.data.r2BaseUrl}
				/>

				<!-- Lien vers édition -->
				<div class="pt-2 border-t border-gray-100">
					<a
						href="/admin/questions/{selectedReport.questionId}/edit"
						class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-100"
					>
						Modifier la question →
					</a>
				</div>
			</div>
		</div>
	{/if}
</div>

{#if toastVisible}
	<div class="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-sm text-white shadow-lg">
		<span>Statut mis à jour.</span>
		<button onclick={() => (toastVisible = false)} class="text-gray-400 hover:text-white" aria-label="Fermer">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{/if}
