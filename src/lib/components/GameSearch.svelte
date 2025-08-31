<script lang="ts">
	import { Heading, Button, Modal, Label, Input, Spinner, Card } from 'flowbite-svelte';
	import { db, auth } from '$lib/firebase'; // Импортируем auth
	import { addDoc, collection } from 'firebase/firestore';
	import { allGames } from '$lib/stores/allGames';

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
		publisher?: string[];
		series?: string;
	}

	let showModal = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<GameSearchResult[]>([]);
	let isLoading = $state(false);

	// Эффект для выполнения поиска с дебаунсингом (задержкой)
	$effect(() => {
		const query = searchQuery;
		if (!query) {
			searchResults = [];
			return;
		}
		const timeoutId = setTimeout(() => {
			performSearch(query);
		}, 500);
		return () => clearTimeout(timeoutId);
	});

	// Функция для выполнения поиска
	async function performSearch(query: string) {
		if (!query) {
			searchResults = [];
			isLoading = false;
			return;
		}
		isLoading = true;
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
	}

	async function handleAddGame(game: GameSearchResult) {
        const user = auth.currentUser; // Получаем текущего пользователя напрямую

        if (!user || !user.uid) {
            alert("You must be logged in to add a game.");
            return;
        }

		const existingGame = $allGames.find(g => g.rawgId === game.id);
		if (existingGame) {
			alert(`This game is already in your '${existingGame.status}' list.`);
			showModal = false;
			return;
		}

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
			await addDoc(collection(db, 'Games'), { // Используем коллекцию "Games"
                userId: user.uid, // Используем user.uid
				rawg_id: game.id,
				status: status,
				title: game.title,
				year: game.year,
				image_url: game.image_url,
				genres: game.genres || [],
				developer: detailedGameData.developer || [],
				publisher: detailedGameData.publisher || [],
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
	<Button onclick={() => showModal = true}>ADD GAME</Button>
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
		<div class="grid grid-cols-2 gap-4 p-4 overflow-y-auto flex-grow">
			{#each searchResults as game (game.id)}
				{@const isGameAdded = $allGames.some(g => g.rawgId === game.id)}
				<Card img={game.image_url} horizontal size="sm"
						onclick={isGameAdded ? undefined : () => handleAddGame(game)}
							class="relative cursor-pointer hover:shadow-lg transition-shadow duration-200 {isGameAdded ? 'opacity-30 cursor-not-allowed' : ''}">
					<div class="p-2">
						<Heading tag="h6" class="mb-2 text-lg   text-gray-900 dark:text-white">{game.title}</Heading>
						<p class="mb-3 leading-tight font-normal text-gray-700 dark:text-gray-400">{game.year || 'N/A'}</p>
					</div>
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
