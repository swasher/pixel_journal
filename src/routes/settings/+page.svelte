<script lang="ts">
	import { Heading, Label, Tags, Button, Spinner } from 'flowbite-svelte';
	import { user, db } from '$lib/firebase';
	import { doc, getDoc, setDoc } from 'firebase/firestore';

	let userTags = $state<string[]>([]);
	let isLoading = $state(true);
	const currentUser = $derived(user);

	// Fetch tags on component mount
	$effect(() => {
		async function fetchTags() {
			if (!$currentUser) {
				// Если пользователь еще не загружен, ждем
				isLoading = true;
				return;
			}
			const userSettingsRef = doc(db, 'user_settings', $currentUser.uid);
			const docSnap = await getDoc(userSettingsRef);

			if (docSnap.exists()) {
				userTags = docSnap.data().tags || [];
			} else {
				// No settings doc yet, so tags are empty
				userTags = [];
			}
			isLoading = false;
		}
		fetchTags();
	});

	async function saveTags() {
		if (!$currentUser) {
			alert('You must be logged in to save settings.');
			return;
		}
		isLoading = true;
		try {
			const userSettingsRef = doc(db, 'user_settings', $currentUser.uid);
			await setDoc(userSettingsRef, { tags: userTags }, { merge: true });
			// Можно добавить уведомление об успешном сохранении
		} catch (error) {
			console.error("Error saving tags: ", error);
			alert('Failed to save tags.');
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container mx-auto p-4 max-w-2xl">
	<Heading tag="h1" class="mb-6">Settings</Heading>

	{#if isLoading}
		<div class="flex justify-center items-center py-10">
			<Spinner size="8" />
		</div>
	{:else}
		<div class="space-y-6">
			<div>
				<Label for="user-tags" class="block mb-2 text-lg font-semibold">Your Custom Tags</Label>
				<p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
					Add or remove tags that you can later assign to your games. Press Enter to add a tag.
				</p>
				<Tags id="user-tags" bind:value={userTags} unique={true} placeholder="Add a new tag..." />
			</div>

			<div class="flex justify-end border-t dark:border-gray-700 pt-4">
				<Button onclick={saveTags} disabled={isLoading}>Save Tags</Button>
			</div>
		</div>
	{/if}
</div>