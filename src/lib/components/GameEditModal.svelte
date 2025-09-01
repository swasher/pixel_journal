<script lang="ts">
	import { Modal, Label, Input, Button, Textarea, Toggle, Range, Select, Tags } from 'flowbite-svelte';
	import { db, user } from '$lib/firebase';
	import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
	import DeleteConfirmationModal from '$lib/components/DeleteConfirmationModal.svelte';

	interface GameData {
		id: string;
		rawg_id: number; // Добавляем rawg_id
		title: string;
		year: number | null;
		image_url: string;
		developer?: string[];
		publisher?: string[];
		genres?: string[];
		series?: string;
		user_note?: string;
		is_favorite?: boolean;
		user_rating?: number;
		play_time?: number;
		markdown_content?: string;
		status: 'backlog' | 'completed' | 'rejected' | 'abandoned';
		date_added?: Date;
		tags?: string[]; // <-- Добавляем поле для тегов
	}

	let { game, onClose } = $props<{ game: GameData; onClose: () => void }>();

	// Внутреннее состояние формы, инициализированное данными из game
	let editedGame = $state<GameData>({ ...game, tags: game.tags || [] }); // <-- Инициализируем теги
	let isModalOpen = $state(true);
	let isDeleteModalOpen = $state(false);
	let availableTags = $state<string[]>([]); // <-- Для хранения списка всех тегов пользователя
	const currentUser = $derived(user);

	// Создаем производные строковые состояния для полей с массивами
	let developerString = $state(editedGame.developer?.join(', ') || '');
	let publisherString = $state(editedGame.publisher?.join(', ') || ''); // Добавляем publisherString
	let genresString = $state(editedGame.genres?.join(', ') || '');

	const statusOptions = [
		{ value: 'backlog', name: 'Backlog' },
		{ value: 'completed', name: 'Completed' },
		{ value: 'rejected', name: 'Rejected' },
		{ value: 'abandoned', name: 'Abandoned' }
	];

	// <-- Загружаем доступные теги при открытии модального окна
	$effect(() => {
		async function fetchUserTags() {
			if (!$currentUser) return;
			const userSettingsRef = doc(db, 'user_settings', $currentUser.uid);
			const docSnap = await getDoc(userSettingsRef);
			if (docSnap.exists()) {
				availableTags = docSnap.data().tags || [];
			}
		}
		fetchUserTags();
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

	async function handleSave(event: SubmitEvent) {
		event.preventDefault(); // Теперь мы вызываем preventDefault здесь
		try {
			const gameRef = doc(db, 'Games', editedGame.id);
			const updatedData: Record<string, any> = {};

			// Iterate over all possible fields and add them only if they are not undefined
			// For arrays and strings, ensure they are not undefined, converting null to default empty values if necessary
			if (editedGame.title !== undefined) updatedData.title = editedGame.title;
			if (editedGame.year !== undefined) updatedData.year = editedGame.year;
			updatedData.developer = editedGame.developer || []; // Ensure it's an array, not undefined/null
			updatedData.publisher = editedGame.publisher || []; // Ensure it's an array, not undefined/null
			updatedData.genres = editedGame.genres || []; // Ensure it's an array, not undefined/null
			updatedData.series = editedGame.series || ''; // Ensure it's a string, not undefined/null
			updatedData.user_note = editedGame.user_note || ''; // Ensure it's a string, not undefined/null
			if (editedGame.is_favorite !== undefined)
				updatedData.is_favorite = editedGame.is_favorite;
			if (editedGame.user_rating !== undefined) updatedData.user_rating = editedGame.user_rating;
			if (editedGame.play_time !== undefined) updatedData.play_time = editedGame.play_time;
			updatedData.markdown_content = editedGame.markdown_content || ''; // Ensure it's a string, not undefined/null
			if (editedGame.status !== undefined) updatedData.status = editedGame.status;
			updatedData.tags = editedGame.tags || []; // <-- Сохраняем теги

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
		try {
			await deleteDoc(doc(db, 'Games', game.id));
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
			<div>
				<Label for="user_rating" class="mb-2">Your Rating (1-5)</Label>
				<Range
					id="user_rating"
					min="0"
					max="5"
					step="1"
					bind:value={editedGame.user_rating}
				/>
				<p class="text-sm text-gray-500 dark:text-gray-400">
					Current: {editedGame.user_rating || 0}
				</p>
			</div>
			<div class="md:col-span-2">
				<Label for="status" class="mb-1">Status</Label>
				<Select size="sm" id="status" items={statusOptions} bind:value={editedGame.status} />
			</div>
			<!-- Поле для тегов -->
			<div class="md:col-span-2">
				<Label for="game-tags" class="mb-1">Tags</Label>
				<Tags
					id="game-tags"
					bind:value={editedGame.tags}
					availableTags={availableTags}
					allowNewTags={false}
					showAvailableTags={true}
					placeholder="Select tags..."
				/>
			</div>
		</div>

		<div class="mb-4">
			<Label for="user_note" class="mb-2">Your Note</Label>
			<Textarea id="user_note" bind:value={editedGame.user_note} rows={2} cols={88} />
		</div>

		<div class="flex items-center mb-4">
			<Toggle bind:checked={editedGame.is_favorite}>My favorite game</Toggle>
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
		on:confirm={confirmDelete}
		on:cancel={() => (isDeleteModalOpen = false)}
	/>
{/if}
