<script lang="ts">
	import { Heading, Button, Modal, Label, Input, Spinner, Card } from 'flowbite-svelte';
	import { db } from '$lib/firebase';
	import { addDoc, collection } from 'firebase/firestore';
	import { allGames } from '$lib/stores/allGames'; // Импортируем allGames стор

	let { status } = $props<{ status: 'backlog' | 'completed' | 'rejected' | 'abandoned' }>();

	interface GameSearchResult {
		id: number;
		title: string;
		year: number | null;
		image_url: string;
		genres?: string[];
	}

	interface GameDetailsResult {
		developer?: string[];
		publisher?: string;
		series?: string;
	}

	let showModal = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<GameSearchResult[]>([]);
	let isLoading = $state(false);

	// Подписываемся на allGames стор
	// let $allGames = $state(allGames);

	// Debounce function
	function debounce<F extends (...args: any[]) => void>(func: F, delay: number) {
		let timeoutId: NodeJS.Timeout;
		return (...args: Parameters<F>): void => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func(...args), delay);
		};
	}

	const debouncedSearch = debounce(async (query: string) => {
		if (!query) {
			searchResults = [];
			isLoading = false;
			return;
		}

		isLoading = true;
		// Не будем очищать результаты сразу, чтобы интерфейс не "прыгал"

		try {
			const response = await fetch(`/api/search-game?q=${encodeURIComponent(query)}`);
			const data = await response.json();

			if (response.ok) {
				searchResults = data;
			} else {
				console.error('Search error:', data.error || 'Unexpected response format');
				searchResults = [];
			}
		} catch (error) {
			console.error('Failed to fetch search results:', error);
			searchResults = [];
		} finally {
			isLoading = false;
		}
	}, 500);

	// Reactive declaration to trigger debounced search on searchQuery change
	$effect.pre(() => {
		// Теперь эффект зависит от searchQuery и будет перезапускаться при его изменении
		debouncedSearch(searchQuery);
	});

	async function handleAddGame(game: GameSearchResult) {
		// Проверяем, есть ли игра уже в базе
		const existingGame = $allGames.find(g => g.rawgId === game.id);
		if (existingGame) {
			alert(`This game is already in your \'${existingGame.status}\' list.`);
			showModal = false;
			return;
		}

		// Шаг 3: Запрашиваем детальную информацию перед добавлением
		let detailedGameData: GameDetailsResult = {};
		try {
			const detailsResponse = await fetch(`/api/game-details?id=${game.id}`);
			if (detailsResponse.ok) {
				detailedGameData = await detailsResponse.json();
			} else {
				console.error('Failed to fetch game details:', await detailsResponse.json());
			}
		} catch (error) {
			console.error('Error fetching game details:', error);
		}

		try {
			await addDoc(collection(db, 'games'), {
				rawg_id: game.id, // Сохраняем ID из RAWG для сопоставления
				status: status,
				title: game.title,
				year: game.year,
				image_url: game.image_url,
				genres: game.genres || [],
				developer: detailedGameData.developer || [],
				publisher: detailedGameData.publisher || '',
				series: detailedGameData.series || '',
				user_note: '',
				is_favorite: false,
				user_rating: 0,
				date_added: new Date(),
				play_time: 0
			});
			console.log(`Game added to ${status}:`, game.title);
		} catch (error) {
			console.error('Error adding document: ', error);
		}
		showModal = false;
	}
</script>

<div class="flex justify-between items-center mb-4">
	<Heading tag="h1" class="capitalize">{status}</Heading>
	<Button onclick={() => showModal = true}>ADD</Button>
</div>

<Modal title="Add a new game" bind:open={showModal} class="w-full max-w-4xl h-[80vh] flex flex-col">
	<div class="p-4 border-b dark:border-gray-700">
		<Label for="game-name" class="mb-2 sr-only">Game Name</Label>
		<Input id="game-name" type="text" placeholder="Search for a game..." required bind:value={searchQuery}
					 class="w-full" />
	</div>

	{#if isLoading && searchResults.length === 0}
		<div class="flex justify-center items-center flex-grow">
			<Spinner size=12 />
		</div>
	{:else if searchResults.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 overflow-y-auto flex-grow">
			{#each searchResults as game (game.id)}
				{@const isGameAdded = $allGames.some(g => g.rawgId === game.id)}
				<Card img={game.image_url} onclick={isGameAdded ? undefined : () => handleAddGame(game)}
							class="relative cursor-pointer hover:shadow-lg transition-shadow duration-200 {isGameAdded ? 'opacity-50 cursor-not-allowed' : ''}">
					<Heading tag="h5" class="mb-2">{game.title}</Heading>
					<p class="font-normal text-gray-700 dark:text-gray-400">{game.year || 'N/A'}</p>
					{#if isGameAdded}
						{@const addedGame = $allGames.find(g => g.rawgId === game.id)}
						<div class="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 text-white text-lg font-bold rounded-lg">
							Added to {addedGame?.status || 'your library'}
						</div>
					{/if}
				</Card>
			{/each}
		</div>
	{:else if searchQuery && !isLoading && searchResults.length === 0}
		<div class="flex justify-center items-center flex-grow text-gray-500 dark:text-gray-400">
			No results found for "{searchQuery}"
		</div>
	{:else}
		<div class="flex justify-center items-center flex-grow text-gray-500 dark:text-gray-400">
			Start typing to search for games.
		</div>
	{/if}
</Modal>
