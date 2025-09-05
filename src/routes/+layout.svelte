<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Header.svelte';
	import Auth from '$lib/components/Auth.svelte';
	import { user } from '$lib/firebase';
	import { Progressbar } from 'flowbite-svelte';
</script>

<!-- Loading indicator: thin progress bar at the top -->
<div class="fixed top-0 left-0 w-full z-50 h-1">
	{#if $user === undefined}
		<Progressbar size="h-1" color="pink" indeterminate />
	{/if}
</div>

{#if $user}
	<!-- User is logged in: show the site -->
	<Navbar />
	<main class="p-4 pt-20
		scrollbar-thumb-gray-700 dark:scrollbar-thumb-gray-400
 		scrollbar-track-gray-300 dark:scrollbar-track-gray-800
	">
		<slot />
	</main>
{:else if $user === null}
	<!-- User is logged out (and auth state is resolved): show the auth form -->
	<div class="flex min-h-screen items-center justify-center">
		<Auth />
	</div>
{/if}
<!-- Note: if $user is undefined, neither of the blocks above will render, showing a blank page with only the progress bar. This is the desired behavior to prevent flicker. -->
