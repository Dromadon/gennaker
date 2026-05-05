<script lang="ts">
	import type { PageData } from './$types'
	import type { AuditLogRow } from '$lib/server/db/queries/audit'

	let { data }: { data: PageData } = $props()

	let modalRow = $state<AuditLogRow | null>(null)

	const ACTION_LABELS: Record<string, string> = {
		'question.create': 'Création question',
		'question.update': 'Modification question',
		'question.delete': 'Suppression question',
		'submission.approve': 'Approbation soumission',
		'submission.reject': 'Rejet soumission',
		'report.resolve': 'Résolution signalement',
		'report.reopen': 'Réouverture signalement'
	}

	const ACTION_COLORS: Record<string, string> = {
		'question.create': 'bg-green-100 text-green-800',
		'question.update': 'bg-blue-100 text-blue-800',
		'question.delete': 'bg-red-100 text-red-800',
		'submission.approve': 'bg-orange-100 text-orange-800',
		'submission.reject': 'bg-orange-100 text-orange-800',
		'report.resolve': 'bg-orange-100 text-orange-800',
		'report.reopen': 'bg-orange-100 text-orange-800'
	}

	const TARGET_LABELS: Record<string, string> = {
		question: 'Question',
		submission: 'Soumission',
		report: 'Signalement'
	}

	const TARGET_LINKS: Record<string, (id: number) => string> = {
		question: (id) => `/admin/questions/${id}/edit`,
		submission: (id) => `/admin/submissions`,
		report: (id) => `/admin/reports`
	}

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const PAGE_SIZE = 50
	const totalPages = $derived(Math.ceil(data.total / PAGE_SIZE))

	function buildPageUrl(page: number): string {
		const params = new URLSearchParams()
		if (data.filters.adminId) params.set('adminId', String(data.filters.adminId))
		if (data.filters.targetType) params.set('targetType', data.filters.targetType)
		if (data.filters.from) params.set('from', data.filters.from)
		if (data.filters.to) params.set('to', data.filters.to)
		params.set('page', String(page))
		return `/admin/audit?${params.toString()}`
	}

	function buildExportUrl(): string {
		const params = new URLSearchParams()
		if (data.filters.adminId) params.set('adminId', String(data.filters.adminId))
		if (data.filters.targetType) params.set('targetType', data.filters.targetType)
		if (data.filters.from) params.set('from', data.filters.from)
		if (data.filters.to) params.set('to', data.filters.to)
		return `/admin/audit/export?${params.toString()}`
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-xl font-semibold text-gray-900">Journal d'activité</h1>
		<a
			href={buildExportUrl()}
			class="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
		>
			Exporter CSV
		</a>
	</div>

	<!-- Filtres -->
	<form method="GET" class="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
		<div class="flex flex-col gap-1">
			<label for="adminId" class="text-xs font-medium text-gray-500">Admin</label>
			<select
				id="adminId"
				name="adminId"
				class="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
			>
				<option value="">Tous</option>
				{#each data.allAdmins as admin}
					<option value={admin.id} selected={data.filters.adminId === admin.id}>
						{admin.firstName} {admin.lastName}
					</option>
				{/each}
			</select>
		</div>

		<div class="flex flex-col gap-1">
			<label for="targetType" class="text-xs font-medium text-gray-500">Type</label>
			<select
				id="targetType"
				name="targetType"
				class="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
			>
				<option value="" selected={!data.filters.targetType}>Tous</option>
				<option value="question" selected={data.filters.targetType === 'question'}>Questions</option>
				<option value="submission" selected={data.filters.targetType === 'submission'}>Soumissions</option>
				<option value="report" selected={data.filters.targetType === 'report'}>Signalements</option>
			</select>
		</div>

		<div class="flex flex-col gap-1">
			<label for="from" class="text-xs font-medium text-gray-500">Du</label>
			<input
				id="from"
				type="date"
				name="from"
				value={data.filters.from ?? ''}
				class="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="to" class="text-xs font-medium text-gray-500">Au</label>
			<input
				id="to"
				type="date"
				name="to"
				value={data.filters.to ?? ''}
				class="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700"
			/>
		</div>

		<button
			type="submit"
			class="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-700"
		>
			Filtrer
		</button>
		<a href="/admin/audit" class="rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
			Réinitialiser
		</a>
	</form>

	<!-- Tableau -->
	<div class="rounded-lg border border-gray-200 bg-white overflow-hidden">
		<div class="px-4 py-3 border-b border-gray-100 text-sm text-gray-500">
			{data.total} événement{data.total !== 1 ? 's' : ''}
		</div>
		{#if data.rows.length === 0}
			<p class="px-4 py-8 text-center text-sm text-gray-400">Aucun événement</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
						<tr>
							<th class="px-4 py-3 text-left">Date/heure</th>
							<th class="px-4 py-3 text-left">Admin</th>
							<th class="px-4 py-3 text-left">Action</th>
							<th class="px-4 py-3 text-left">Cible</th>
							<th class="px-4 py-3 text-left">Détail</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						{#each data.rows as row}
							<tr class="hover:bg-gray-50">
								<td class="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(row.createdAt)}</td>
								<td class="px-4 py-3 text-gray-700">{row.adminName ?? '—'}</td>
								<td class="px-4 py-3">
									<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {ACTION_COLORS[row.action] ?? 'bg-gray-100 text-gray-700'}">
										{ACTION_LABELS[row.action] ?? row.action}
									</span>
								</td>
								<td class="px-4 py-3">
									{#if row.targetId !== null}
										<a
											href={TARGET_LINKS[row.targetType]?.(row.targetId) ?? '#'}
											class="text-blue-600 hover:underline"
										>
											{TARGET_LABELS[row.targetType] ?? row.targetType} #{row.targetId}
										</a>
									{:else}
										<span class="text-gray-400">—</span>
									{/if}
								</td>
								<td class="px-4 py-3">
									<button
										type="button"
										onclick={() => (modalRow = row)}
										class="text-xs text-gray-500 hover:text-gray-900 underline"
									>
										Voir
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="flex items-center justify-between border-t border-gray-100 px-4 py-3">
					<span class="text-xs text-gray-500">Page {data.page} / {totalPages}</span>
					<div class="flex gap-2">
						{#if data.page > 1}
							<a href={buildPageUrl(data.page - 1)} class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
								Précédent
							</a>
						{/if}
						{#if data.page < totalPages}
							<a href={buildPageUrl(data.page + 1)} class="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
								Suivant
							</a>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Modal JSON -->
{#if modalRow !== null}
	<button
		class="fixed inset-0 z-40 bg-black/40"
		onclick={() => (modalRow = null)}
		aria-label="Fermer"
	></button>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
			<div class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
				<span class="text-sm font-medium text-gray-800">
					{ACTION_LABELS[modalRow.action] ?? modalRow.action} — {formatDate(modalRow.createdAt)}
				</span>
				<button
					onclick={() => (modalRow = null)}
					class="text-gray-400 hover:text-gray-600"
					aria-label="Fermer"
				>
					✕
				</button>
			</div>
			<div class="max-h-[60vh] overflow-y-auto p-4">
				<pre class="rounded bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap break-all">{JSON.stringify(modalRow.metadata, null, 2)}</pre>
			</div>
		</div>
	</div>
{/if}
