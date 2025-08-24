<script lang="ts">
	import { auth, user } from "$lib/firebase";
	import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
	import { Button, Label, Input, Spinner, Card } from "flowbite-svelte"; // Импортируем Card

	let email = $state('');
	let password = $state('');
	let authMode:  'login' | 'register' = $state('login');
	let errorMessage = $state('');
	let isLoading = $state(false); // Состояние для индикатора загрузки

	async function register() {
		isLoading = true;
		errorMessage = '';
		try {
			await createUserWithEmailAndPassword(auth, email, password);
			console.log("Регистрация успешна!");
		} catch (error: any) {
			console.error("Ошибка регистрации:", error.message);
			// Отображаем понятное сообщение об ошибке
			if (error.code === 'auth/email-already-in-use') {
				errorMessage = "Этот email уже зарегистрирован. Попробуйте войти.";
			} else if (error.code === 'auth/weak-password') {
				errorMessage = "Пароль слишком слабый. Минимум 6 символов.";
			} else {
				errorMessage = "Произошла ошибка при регистрации. Попробуйте еще раз.";
			}
		} finally {
			isLoading = false;
		}
	}

	async function login() {
		isLoading = true;
		errorMessage = '';
		try {
			await signInWithEmailAndPassword(auth, email, password);
			console.log("Вход успешен!");
		} catch (error: any) {
			console.error("Ошибка входа:", error.message);
			// Отображаем понятное сообщение об ошибке
			if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
				errorMessage = "Неверный email или пароль.";
			} else {
				errorMessage = "Произошла ошибка при входе. Попробуйте еще раз.";
			}
		} finally {
			isLoading = false;
		}
	}

	function handleSubmit(event: Event) {
		event.preventDefault();
		if (authMode === 'login') {
			login();
		} else {
			register();
		}
	}
</script>

<Card class="max-w-sm mx-auto p-6 my-8">
	<h1 class="text-2xl font-bold mb-4 text-white">{authMode === 'login' ? 'Вход в систему' : 'Регистрация'}</h1>

	{#if errorMessage}
		<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
			{errorMessage}
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-4">
		<div>
			<Label for="email" class="mb-2">Email</Label>
			<Input id="email" type="email" bind:value={email} placeholder="name@flowbite.com" required disabled={isLoading} />
		</div>
		<div>
			<Label for="password" class="mb-2">Пароль</Label>
			<Input id="password" type="password" bind:value={password} required disabled={isLoading} />
		</div>

		{#if isLoading}
			<div class="flex justify-center">
				<Spinner size="8" />
			</div>
		{:else}
			<Button type="submit" class="w-full">
				{authMode === 'login' ? 'Войти' : 'Зарегистрироваться'}
			</Button>
		{/if}

		<button type="button" onclick={() => { authMode = authMode === 'login' ? 'register' : 'login'; errorMessage = ''; }} class="text-blue-500 hover:underline">
			{authMode === 'login' ? 'Нужен аккаунт? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
		</button>
	</form>
</Card>
