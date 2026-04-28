<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

	let { children } = $props();

	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !isAdmin}
	<nav class="border-b border-gray-200 bg-white px-6 py-3 flex items-center print:hidden">
		<a href="/" class="text-sm font-semibold text-gray-700 hover:text-gray-900">Gennaker</a>
	</nav>
{/if}

{@render children()}
