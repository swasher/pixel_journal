<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/footer.svelte';
	import Navbar from '$lib/components/navbar.svelte';
	import Auth from '$lib/components/Auth.svelte';
	import { user } from '$lib/firebase'; // Импортируем user store
</script>

{#if $user}
	<Navbar />

	<!-- pt-16 компенсирует высоту Navbar. ml-72 убран, т.к. боковая панель - часть конкретной страницы, а не всего layout. -->
	<main class="p-4 pt-16">
		<slot />
	</main>

	<Footer />
{:else}
	<div class="flex justify-center items-center min-h-screen">
		<Auth />
	</div>
{/if}