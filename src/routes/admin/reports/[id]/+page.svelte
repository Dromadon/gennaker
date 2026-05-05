<script lang="ts">
	import { page } from '$app/state'
	import type { PageData } from './$types'
	import type { ReportStatus } from '$lib/server/db/queries/reports'
	import QuestionPreview from '$lib/components/QuestionPreview.svelte'

	let { data }: { data: PageData } = $props()

	const { report } = data

	const PROBLEM_LABELS: Record<string, string> = {
		enonce_incorrect: 'Énoncé incorrect',
		correction_incorrecte: 'Correction incorrecte',
		question_doublon: 'Doublon',
		mise_en_forme: 'Mise en forme',
		autre: 'Autre'
	}

	const STATUS_LABELS: Record<ReportStatus, string> = {
		nouveau: 'Nouveau',
		resolu: 'Résolu'
	}

	const STATUS_BADGE: Record<ReportStatus, string> = {
		nouveau: 'bg-yellow-100 text-yellow-700',
		resolu: 'bg-green-100 text-green-700'
	}

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		})
	}
</script>

<div class="space-y-6">
	<div class="flex items-center gap-3">
		<a href="/admin/reports" class="text-sm text-gray-500 hover:text-gray-800">← Signalements</a>
		<span class="text-gray-300">/</span>
		<h1 class="text-xl font-semibold text-gray-900">Signalement #{report.id}</h1>
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
		<!-- Infos signalement -->
		<div class="space-y-2 text-sm">
			<div>
				<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Statut</span>
				<span
					class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[report.status]}"
				>
					{STATUS_LABELS[report.status]}
				</span>
			</div>
			<div>
				<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Date</span>
				<p class="text-gray-700">{formatDate(report.createdAt)}</p>
			</div>
			<div>
				<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Type</span>
				<p class="text-gray-700">{PROBLEM_LABELS[report.problemType] ?? report.problemType}</p>
			</div>
			{#if report.email}
				<div>
					<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Email de contact</span>
					<p class="text-gray-700">{report.email}</p>
				</div>
			{/if}
			<div>
				<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Description</span>
				<p class="text-gray-700 whitespace-pre-wrap">{report.description ?? '—'}</p>
			</div>
		</div>

		<hr class="border-gray-200" />

		<QuestionPreview
			questionId={report.questionId}
			title={report.questionTitle}
			categoryDisplayName={report.categoryDisplayName}
			sectionDisplayName={report.sectionDisplayName}
			difficulty={report.difficulty}
			applicableSupports={JSON.parse(report.applicableSupports)}
			questionMd={report.questionMd}
			correctionMd={report.correctionMd}
			sourceMd={report.sourceMd}
			r2BaseUrl={page.data.r2BaseUrl}
		/>

		<!-- Action toggle statut -->
		<div class="flex items-center justify-between border-t border-gray-100 pt-3">
			<a
				href="/admin/questions/{report.questionId}/edit"
				class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-100"
			>
				Modifier la question →
			</a>

			<form method="POST" action="/admin/reports?/toggleStatus">
				<input type="hidden" name="id" value={report.id} />
				<input type="hidden" name="questionId" value={report.questionId} />
				{#if report.status === 'nouveau'}
					<button
						type="submit"
						name="status"
						value="resolu"
						class="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:border-green-400 hover:text-green-700"
					>
						Marquer résolu
					</button>
				{:else}
					<button
						type="submit"
						name="status"
						value="nouveau"
						class="rounded border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:border-orange-400 hover:text-orange-700"
					>
						Rouvrir
					</button>
				{/if}
			</form>
		</div>
	</div>
</div>
