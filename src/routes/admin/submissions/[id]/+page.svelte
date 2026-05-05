<script lang="ts">
	import { page } from '$app/state'
	import type { PageData } from './$types'
	import type { SubmissionStatus } from '$lib/server/db/queries/submissions'
	import QuestionPreview from '$lib/components/QuestionPreview.svelte'

	let { data }: { data: PageData } = $props()

	const { submission } = data

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
		<a href="/admin/submissions" class="text-sm text-gray-500 hover:text-gray-800">← Soumissions</a>
		<span class="text-gray-300">/</span>
		<h1 class="text-xl font-semibold text-gray-900">Soumission #{submission.id}</h1>
	</div>

	<div class="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
		<!-- Métadonnées -->
		<div class="space-y-2 text-sm">
			<div>
				<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Soumis par</span>
				<p class="text-gray-700">
					{submission.submitterName} —
					<a href="mailto:{submission.submitterEmail}" class="text-blue-600 hover:underline"
						>{submission.submitterEmail}</a
					>
				</p>
			</div>
			<div>
				<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Date</span>
				<p class="text-gray-700">{formatDate(submission.createdAt)}</p>
			</div>
			<div>
				<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Statut</span>
				<span
					class="inline-block rounded-full px-2 py-0.5 text-xs font-medium {STATUS_BADGE[submission.status]}"
				>
					{STATUS_LABELS[submission.status]}
				</span>
			</div>
			{#if submission.status === 'rejete' && submission.rejectionNote}
				<div>
					<span class="text-xs font-medium uppercase tracking-wide text-gray-400">Note de rejet</span>
					<p class="text-gray-700 whitespace-pre-wrap">{submission.rejectionNote}</p>
				</div>
			{/if}
		</div>

		<hr class="border-gray-200" />

		<QuestionPreview
			questionId={0}
			title={submission.title}
			categoryDisplayName={submission.categoryDisplayName}
			sectionDisplayName={submission.sectionDisplayName}
			difficulty="—"
			applicableSupports={JSON.parse(submission.applicableSupports)}
			questionMd={submission.questionMd}
			correctionMd={submission.correctionMd}
			r2BaseUrl={page.data.r2BaseUrl}
		/>

		<!-- Actions -->
		{#if submission.status === 'en_attente'}
			<div class="space-y-3 border-t border-gray-100 pt-3">
				<form method="POST" action="/admin/submissions?/approve">
					<input type="hidden" name="id" value={submission.id} />
					<button
						type="submit"
						class="w-full rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:border-green-500 hover:bg-green-100"
					>
						Approuver — créer en brouillon
					</button>
				</form>

				<form method="POST" action="/admin/submissions?/reject" class="space-y-2">
					<input type="hidden" name="id" value={submission.id} />
					<textarea
						name="rejectionNote"
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
		{#if submission.status === 'approuve' && submission.approvedQuestionId}
			<div class="border-t border-gray-100 pt-3">
				<a
					href="/admin/questions/{submission.approvedQuestionId}/edit"
					class="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:border-blue-400 hover:bg-blue-100"
				>
					Voir dans l'admin questions →
				</a>
			</div>
		{/if}
	</div>
</div>
