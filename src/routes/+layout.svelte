<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Header.svelte';
	import Auth from '$lib/components/Auth.svelte';
	import { user } from '$lib/firebase';
	import { Progressbar } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import { allGames } from '$lib/stores/allGames';
	import { userSettings } from '$lib/stores/userSettings';
	import { page } from '$app/stores';

	let { children } = $props();

	let initialCheckDone = $state(false);
	let prevUser = $state(null);

	$effect(() => {
		// This effect handles the initial redirect after login.

		// Condition 1: We have a user, but we didn't have one before (i.e., user just logged in).
		const justLoggedIn = $user && !prevUser;

		// Condition 2: The essential user data stores are loaded and ready.
		const storesReady = $userSettings.categories.length > 0;

		if (justLoggedIn && storesReady && !initialCheckDone) {
			initialCheckDone = true;

			// Only perform the initial redirect if the user lands on the root page.
			// If they refresh any other page, they should stay there.
			if ($page.url.pathname === '/') {
				console.log('User on root page, performing initial redirect...');
				if ($allGames.length === 0) {
					console.log('No games found, redirecting to general notes.');
					goto('/notes', { replaceState: true });
				} else {
					const firstCategory = $userSettings.categories[0];
					console.log(`Games found, redirecting to first category: ${firstCategory}`);
					goto(`/${firstCategory}`, { replaceState: true });
				}
			}
		}

		// If the user logs out, reset the check.
		if (!$user && prevUser) {
			initialCheckDone = false;
		}

		// Update previous user state for the next run.
		prevUser = $user;
	});

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
		{@render children()}
	</main>
{:else if $user === null}
	<!-- User is logged out (and auth state is resolved): show the auth form -->
	<div class="flex min-h-screen items-center justify-center">
		<Auth />
	</div>
{/if}
<!-- Note: if $user is undefined, neither of the blocks above will render, showing a blank page with only the progress bar. This is the desired behavior to prevent flicker. -->
