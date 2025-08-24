<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/footer.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import Auth from '$lib/components/Auth.svelte';
	import { user } from '$lib/firebase'; // Импортируем user store
</script>

{#if $user}
	<Navbar />

	<main class="p-4">
		<slot />
	</main>

	<Footer />
{:else}
	<div class="flex justify-center items-center min-h-screen">
		<Auth />
	</div>
{/if}