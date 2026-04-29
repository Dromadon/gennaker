<script lang="ts">
	import type { PageData, ActionData } from './$types'
	import type { ReportStatus } from '$lib/server/db/queries/reports'

	let { data, form }: { data: PageData; form: ActionData } = $props()

	const PAGE_SIZE = 30

	const STATUS_LABELS: Record<ReportStatus, string> = {
		nouveau: 'Nouveau',
		en_cours: 'En cours',
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
		en_cours: 'bg-yellow-100 text-yellow-700',
		resolu: 'bg-green-100 text-green-700'
	}

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

<div class="space-y-6">
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
				class="rounded-md border px-3 py-1.5 text-sm transition-colors {data.statusFilter ===
				value
					? 'border-gray-900 bg-gray-900 text-white'
					: 'border-gray-200 text-gray-600 hover:border-gray-400'}"
			>
				{label}
			</a>
		{/each}
	</div>

	{#if form?.updated}
		<p class="text-sm text-green-600">Statut mis à jour.</p>
	{/if}

	<!-- Tableau -->
	<div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
		<table class="w-full text-sm">
			<thead class="bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
				<tr>
					<th class="px-4 py-3 text-left">Question</th>
					<th class="px-4 py-3 text-left">Type</th>
					<th class="px-4 py-3 text-left">Description</th>
					<th class="px-4 py-3 text-left">Date</th>
					<th class="px-4 py-3 text-left">Statut</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.rows as report}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3">
							<a
								href="/admin/questions/{report.questionId}/edit"
								class="font-medium text-gray-900 hover:text-blue-600 hover:underline"
							>
								{truncate(report.questionTitle, 50)}
							</a>
						</td>
						<td class="px-4 py-3 text-gray-600">
							{PROBLEM_LABELS[report.problemType] ?? report.problemType}
						</td>
						<td class="px-4 py-3 text-gray-500">
							{truncate(report.description)}
						</td>
						<td class="px-4 py-3 text-gray-500 whitespace-nowrap">
							{formatDate(report.createdAt)}
						</td>
						<td class="px-4 py-3">
							<form method="POST" action="?/updateStatus" class="flex items-center gap-2">
								<input type="hidden" name="id" value={report.id} />
								<span
									class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[
										report.status
									]}"
								>
									{STATUS_LABELS[report.status]}
								</span>
								<select
									name="status"
									class="rounded border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700"
									onchange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit()}
								>
									{#each Object.entries(STATUS_LABELS) as [value, label]}
										<option {value} selected={report.status === value}>{label}</option>
									{/each}
								</select>
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
