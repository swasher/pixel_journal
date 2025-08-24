<script lang="ts">
	import '../app.css';
	import Footer from '$lib/components/footer.svelte';
	import Navbar from '$lib/components/navbar.svelte';
</script>


<Navbar />

<main class="p-4">
	<slot />
</main>

<Footer />