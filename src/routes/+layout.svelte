<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/navbar.svelte';
	import Auth from '$lib/components/Auth.svelte';
	import { user } from '$lib/firebase'; // Импортируем только user
	import { Spinner } from 'flowbite-svelte';
</script>

{#if $user === undefined}
	<!-- Состояние неопределенности: показываем спиннер -->
	<div class="flex h-screen w-full items-center justify-center bg-gray-900">
		<Spinner size="12" color="pink" />
	</div>
{:else if $user}
	<!-- Пользователь определен и авторизован: показываем сайт -->
	<Navbar />
	<main class="p-4 pt-20
		scrollbar-thumb-gray-700 dark:scrollbar-thumb-gray-400
 		scrollbar-track-gray-300 dark:scrollbar-track-gray-800
	">
		<slot />
	</main>
{:else}
	<!-- Пользователь определен и не авторизован: показываем форму входа -->
	<div class="flex min-h-screen items-center justify-center">
		<Auth />
	</div>
{/if}