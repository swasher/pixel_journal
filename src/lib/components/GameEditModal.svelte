<script lang="ts">
	import { Modal, Label, Input, Button, Textarea, Toggle, Select, Badge } from 'flowbite-svelte';
	import { db, user } from '$lib/firebase';
	import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';
	import ClickableRating from './ClickableRating.svelte';
    import type { GameData } from "$lib/types";
    import { userSettings } from "$lib/stores/userSettings";

	let { game, onClose } = $props<{ game: GameData; onClose: () => void }>();

	// Отдельное состояние для рейтинга, чтобы обойти проблему с привязкой к вложенному свойству
	let rating = $state(game.user_rating || 0);

	// Внутреннее состояние формы, без рейтинга
	let editedGame = $state<Omit<GameData, 'user_rating'>>({ ...game, tags: game.tags || [] });
	let isModalOpen = $state(true);
	let isDeleteModalOpen = $state(false);
	let availableTags = $state<string[]>([]); // <-- Для хранения списка всех тегов пользователя
	let statusOptions = $state<{ value: string; name: string }[]>([]); // Динамические опции статуса
	const currentUser = $derived(user);

	// Создаем производные строковые состояния для полей с массивами
	let developerString = $state(editedGame.developer?.join(', ') || '');
	let publisherString = $state(editedGame.publisher?.join(', ') || ''); // Добавляем publisherString
	let genresString = $state(editedGame.genres?.join(', ') || '');

	// Загружаем теги и категории пользователя
	$effect(() => {
		async function fetchUserSettings() {
			if (!$currentUser) return;
			const userSettingsRef = doc(db, 'users', $currentUser.uid);
			const docSnap = await getDoc(userSettingsRef);
			if (docSnap.exists()) {
				const userData = docSnap.data();
				availableTags = userData.tags || [];
				// Преобразуем категории в нужный формат
				const categories = userData.categories || [];
				statusOptions = categories.map((cat: string) => ({
					value: cat, // Используем оригинальное название
					name: cat
				}));
			}
		}
		fetchUserSettings();
	});


	// Эффекты для синхронизации строк обратно в массивы
	$effect(() => {
		editedGame.developer = developerString.split(',').map((s) => s.trim()).filter((s) => s);
	});

	$effect(() => {
		editedGame.publisher = publisherString.split(',').map((s) => s.trim()).filter((s) => s); // Добавляем эффект для publisher
	});

	$effect(() => {
		editedGame.genres = genresString.split(',').map((s) => s.trim()).filter((s) => s);
	});

	// Когда модальное окно закрывается (isModalOpen становится false),
	// мы вызываем колбэк onClose, чтобы родительский компонент мог его уничтожить.
	$effect(() => {
		if (!isModalOpen) {
			onClose();
		}
	});

	function toggleTag(tag: string) {
		if (!editedGame.tags) {
			editedGame.tags = [tag];
			return;
		}
		if (editedGame.tags.includes(tag)) {
			editedGame.tags = editedGame.tags.filter((t) => t !== tag);
		} else {
			editedGame.tags = [...editedGame.tags, tag];
		}
	}

	async function handleSave(event: SubmitEvent) {
		event.preventDefault(); // Теперь мы вызываем preventDefault здесь

		if (!$currentUser) {
			console.error("Cannot save game: User not logged in.");
			return;
		}

		try {
			const gameRef = doc(db, 'users', $currentUser.uid, 'games', editedGame.id);
			// Собираем данные для обновления, включая рейтинг из отдельного состояния
			const updatedData: Record<string, any> = {
				...editedGame,
				user_rating: rating ?? 0
			};

			// Очистка undefined значений, если это необходимо (хотя editedGame уже не должен их содержать)
			Object.keys(updatedData).forEach(key => {
				if (updatedData[key] === undefined) {
					delete updatedData[key];
				}
			});

			await updateDoc(gameRef, updatedData);
			console.log('Game updated successfully!');
			onClose();
		} catch (error) {
			console.error('Error updating document: ', error);
		}
	}

	function handleDeleteClick() {
		isDeleteModalOpen = true;
	}

	async function confirmDelete() {
		if (!$currentUser) {
			console.error('Cannot delete game: User not logged in.');
			return;
		}
		try {
			await deleteDoc(doc(db, 'users', $currentUser.uid, 'games', game.id));
			console.log('Game deleted successfully!');
			isDeleteModalOpen = false;
			onClose(); // Закрываем и основное модальное окно
		} catch (error) {
			console.error('Error deleting document: ', error);
		}
	}
</script>

<Modal
	title="Edit Game: {game.title}"
	bind:open={isModalOpen}
	class="w-full max-w-2xl  flex flex-col"
>
	<form onsubmit={handleSave} class="flex flex-col flex-grow px-4 overflow-y-auto overflow-x-hidden">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
			<div>
				<Label for="title" class="mb-2">Title</Label>
				<Input id="title" size="sm" type="text" required bind:value={editedGame.title} />
			</div>
			<div>
				<Label for="year" class="mb-2">Year</Label>
				<Input id="year" size="sm" type="number" bind:value={editedGame.year} />
			</div>
			<div>
				<Label for="developer" class="mb-2">Developer (comma-separated)</Label>
				<Input id="developer" size="sm" type="text" bind:value={developerString} />
			</div>
			<div>
				<Label for="publisher" class="mb-2">Publisher (comma-separated)</Label>
				<Input id="publisher" size="sm" type="text" bind:value={publisherString} />
			</div>
			<div>
				<Label for="genres" class="mb-2">Genres (comma-separated)</Label>
				<Input id="genres" size="sm" type="text" bind:value={genresString} />
			</div>
			<div>
				<Label for="series" class="mb-2">Series</Label>
				<Input id="series" size="sm" type="text" bind:value={editedGame.series} />
			</div>
			<div>
				<Label for="play_time" class="mb-2">Play Time (hours)</Label>
				<Input id="play_time" size="sm" type="number" bind:value={editedGame.play_time} />
			</div>
			<div class="md:col-span-2">
				<Label for="status" class="mb-1">Status</Label>
				<Select size="sm" id="status" items={statusOptions} bind:value={editedGame.status} />
			</div>
			<!-- Поле для тегов -->
			<div class="md:col-span-2">
				<Label class="mb-2">Tags</Label>
				<div
					class="flex flex-wrap gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 min-h-[3rem]"
				>
					{#if availableTags.length > 0}
						{#each availableTags as tag}
							{@const isSelected = editedGame.tags?.includes(tag)}
                            {@const tagColor = $userSettings.tagColors?.[tag] || 'indigo'}
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<div
								onclick={() => toggleTag(tag)}
								role="button"
								tabindex="0"
								class="cursor-pointer transition-transform active:scale-95"
							>
								<Badge
									color={isSelected ? tagColor as any : 'dark'}
									rounded
									class="select-none {isSelected
										? 'font-semibold ring-2 ring-offset-1 ring-offset-transparent'
										: 'opacity-50 hover:opacity-100'}"
								>
									{tag}
								</Badge>
							</div>
						{/each}
					{:else}
						<span class="text-sm text-gray-400 italic">No tags available. Add them in Settings.</span>
					{/if}
				</div>
			</div>
		</div>

		<div class="mb-4">
			<Label for="user_note" class="mb-2">Your Note</Label>
			<Textarea id="user_note" bind:value={editedGame.user_note} rows={2} cols={88} />
		</div>

		<div class="flex items-center justify-between mb-4">
			<Toggle bind:checked={editedGame.is_favorite}>My favorite game</Toggle>
			<ClickableRating rating={rating} onchange={(newRating) => rating = newRating} />
		</div>

		<div class="flex justify-between items-center mt-auto pt-4 border-t dark:border-gray-700">
			<div>
				<Button color="red" onclick={handleDeleteClick}>Delete</Button>
			</div>
			<div class="flex gap-4">
				<Button color="alternative" onclick={onClose}>Cancel</Button>
				<Button type="submit">Save Changes</Button>
			</div>
		</div>
	</form>
</Modal>

{#if isDeleteModalOpen}
	<DeleteConfirmationModal
		open={isDeleteModalOpen}
		message="Are you sure you want to delete this game? This action cannot be undone."
		class="z-60"
		onconfirm={confirmDelete}
		oncancel={() => (isDeleteModalOpen = false)}
	/>
{/if}
