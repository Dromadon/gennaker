<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData, PageData } from './$types'
	let { data, form }: { data: PageData; form: ActionData } = $props()
</script>

<div class="max-w-lg">
	<h1 class="mb-6 text-xl font-semibold text-gray-900">Mon profil</h1>

	{#if data.mustChangePassword}
		<div class="mb-6 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
			Vous devez changer votre mot de passe avant de continuer.
		</div>
	{/if}

	<div class="mb-8 rounded-md border border-gray-200 bg-white p-6">
		<dl class="space-y-3 text-sm">
			<div class="flex gap-4">
				<dt class="w-32 font-medium text-gray-500">Email</dt>
				<dd class="text-gray-900">{data.email}</dd>
			</div>
			<div class="flex gap-4">
				<dt class="w-32 font-medium text-gray-500">Prénom</dt>
				<dd class="text-gray-900">{data.firstName}</dd>
			</div>
			<div class="flex gap-4">
				<dt class="w-32 font-medium text-gray-500">Nom</dt>
				<dd class="text-gray-900">{data.lastName}</dd>
			</div>
		</dl>
	</div>

	<div class="rounded-md border border-gray-200 bg-white p-6">
		<h2 class="mb-4 text-base font-medium text-gray-900">Changer le mot de passe</h2>

		{#if form?.success}
			<p class="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
				Mot de passe modifié avec succès.
			</p>
		{/if}

		{#if form?.error}
			<p class="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{form.error}</p>
		{/if}

		<form method="POST" action="?/changePassword" use:enhance>
			<label class="mb-4 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Mot de passe actuel</span>
				<input
					type="password"
					name="currentPassword"
					required
					autocomplete="current-password"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
				/>
			</label>
			<label class="mb-4 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Nouveau mot de passe <span class="font-normal text-gray-400">(min. 8 caractères)</span></span>
				<input
					type="password"
					name="newPassword"
					required
					minlength="8"
					autocomplete="new-password"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
				/>
			</label>
			<label class="mb-6 block">
				<span class="mb-1 block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</span>
				<input
					type="password"
					name="confirmPassword"
					required
					autocomplete="new-password"
					class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-gray-500 focus:outline-none"
				/>
			</label>
			<button
				type="submit"
				class="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
			>
				Changer le mot de passe
			</button>
		</form>
	</div>
</div>
