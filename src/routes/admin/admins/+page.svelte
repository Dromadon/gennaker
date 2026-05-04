<script lang="ts">
	import { enhance } from '$app/forms'
	import { invalidateAll } from '$app/navigation'
	import type { ActionData, PageData } from './$types'
	let { data, form }: { data: PageData; form: ActionData } = $props()

	let showCreateForm = $state(false)
	let confirmDeleteId = $state<number | null>(null)
	let confirmResetId = $state<number | null>(null)
	let resetConfirmValue = $state('')
	let resetDialog = $state<HTMLDialogElement | null>(null)
</script>

<div>
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-xl font-semibold text-gray-900">Administrateurs</h1>
		<button
			onclick={() => (showCreateForm = !showCreateForm)}
			class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
		>
			{showCreateForm ? 'Annuler' : 'Ajouter un admin'}
		</button>
	</div>

	<!-- Alertes résultat d'action -->
	{#if form?.created}
		<div class="mb-6 rounded-md border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
			<p class="font-medium">Compte créé pour {form.createdEmail}</p>
			<p class="mt-1">Mot de passe temporaire : <code class="rounded bg-green-100 px-1 font-mono text-green-900">{form.tempPassword}</code></p>
			<p class="mt-1 text-green-600">Communiquez ce mot de passe à l'admin. Il devra le changer à la première connexion.</p>
		</div>
	{/if}

	{#if form?.reset}
		<div class="mb-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
			<p class="font-medium">Mot de passe réinitialisé</p>
			<p class="mt-1">Nouveau mot de passe temporaire : <code class="rounded bg-blue-100 px-1 font-mono text-blue-900">{form.tempPassword}</code></p>
			<p class="mt-1 text-blue-600">L'admin devra le changer à la prochaine connexion.</p>
		</div>
	{/if}

	{#if form?.error || form?.createError || form?.deleteError || form?.resetError}
		<div class="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
			{form?.error ?? form?.createError ?? form?.deleteError ?? form?.resetError}
		</div>
	{/if}

	<!-- Formulaire de création -->
	{#if showCreateForm}
		<div class="mb-6 rounded-md border border-gray-200 bg-white p-6">
			<h2 class="mb-4 text-base font-medium text-gray-900">Créer un compte administrateur</h2>
			<form method="POST" action="?/create" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') {
						showCreateForm = false
						await invalidateAll()
					}
					await update()
				}
			}}>
				<div class="grid grid-cols-2 gap-4">
					<label class="block">
						<span class="mb-1 block text-sm font-medium text-gray-700">Prénom</span>
						<input type="text" name="firstName" required maxlength="50"
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none" />
					</label>
					<label class="block">
						<span class="mb-1 block text-sm font-medium text-gray-700">Nom</span>
						<input type="text" name="lastName" required maxlength="50"
							class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none" />
					</label>
				</div>
				<label class="mt-4 block">
					<span class="mb-1 block text-sm font-medium text-gray-700">Email</span>
					<input type="email" name="email" required
						class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none" />
				</label>
				<div class="mt-4">
					<button type="submit"
						class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
						Créer le compte
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Tableau des admins -->
	<div class="rounded-md border border-gray-200 bg-white">
		<table class="w-full text-sm">
			<thead class="border-b border-gray-200 bg-gray-50">
				<tr>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Nom</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Email</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Rôle</th>
					<th class="px-4 py-3 text-left font-medium text-gray-500">Dernière connexion</th>
					<th class="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-100">
				{#each data.admins as admin (admin.id)}
					<tr class="hover:bg-gray-50">
						<td class="px-4 py-3 font-medium text-gray-900">
							{admin.firstName} {admin.lastName}
							{#if admin.mustChangePassword}
								<span class="ml-2 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">mdp à changer</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-gray-600">{admin.email}</td>
						<td class="px-4 py-3">
							{#if admin.role === 'super_admin'}
								<span class="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">Super-admin</span>
							{:else}
								<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Admin</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-gray-500">
							{#if admin.lastLoginAt}
								{new Date(admin.lastLoginAt * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
							{:else}
								<span class="text-gray-400">Jamais connecté</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-right">
							<div class="flex items-center justify-end gap-2">
								<!-- Reset mot de passe -->
								<button
									type="button"
									onclick={() => { resetConfirmValue = ''; confirmResetId = admin.id; resetDialog?.showModal() }}
									class="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900">
									Réinit. mdp
								</button>
								<!-- Suppression -->
								{#if confirmDeleteId === admin.id}
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="targetId" value={admin.id} />
										<button type="submit"
											class="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
											Confirmer
										</button>
									</form>
									<button onclick={() => (confirmDeleteId = null)}
										class="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100">
										Annuler
									</button>
								{:else}
									<button onclick={() => (confirmDeleteId = admin.id)}
										class="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50 hover:text-red-700">
										Supprimer
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<!-- Dialog reset mot de passe -->
<dialog bind:this={resetDialog} class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg p-6 shadow-xl backdrop:bg-black/40 w-full max-w-sm">
	{#if confirmResetId !== null}
		{@const target = data.admins.find(a => a.id === confirmResetId)}
		<h2 class="mb-2 text-base font-semibold text-gray-900">Réinitialiser le mot de passe ?</h2>
		<p class="mb-4 text-sm text-gray-500">
			Le mot de passe de <strong class="text-gray-700">{target?.firstName} {target?.lastName}</strong> sera réinitialisé. Tape <strong class="text-gray-700">reset</strong> pour confirmer.
		</p>
		<input
			type="text"
			bind:value={resetConfirmValue}
			placeholder="reset"
			class="mb-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
		/>
		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={() => { resetDialog?.close(); confirmResetId = null }}
				class="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
			>
				Annuler
			</button>
			<form method="POST" action="?/resetPassword" use:enhance={() => {
				return async ({ result, update }) => {
					resetDialog?.close()
					confirmResetId = null
					await update()
				}
			}}>
				<input type="hidden" name="targetId" value={confirmResetId} />
				<button
					type="submit"
					disabled={resetConfirmValue !== 'reset'}
					class="rounded-md px-4 py-2 text-sm font-medium text-white transition {resetConfirmValue === 'reset' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-200 cursor-not-allowed'}"
				>
					Réinitialiser
				</button>
			</form>
		</div>
	{/if}
</dialog>
