<script lang="ts">
	import { Heading, Button, Modal, Label, Input, Spinner, Card } from 'flowbite-svelte';
	import { db, auth } from '$lib/firebase'; // Импортируем auth
	import { addDoc, collection } from 'firebase/firestore';
	import { allGames } from '$lib/stores/allGames';
	import { userSettings } from '$lib/stores/userSettings';

	import { searchGames, getGameDetails } from '$lib/apiClient';

	let { status, gameToLink = null, onLinkSuccess = null } = $props<{
        status: string;
        gameToLink?: any;
        onLinkSuccess?: (id: number, source: string) => void;
    }>();

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
	let searchQuery = $state(gameToLink?.title || '');
	let searchResults = $state<GameSearchResult[]>([]);
	let isLoading = $state(false);

    // Open modal automatically and search if gameToLink is provided
    $effect(() => {
        if (gameToLink) {
            showModal = true;
            searchQuery = gameToLink.title;
            performSearch(searchQuery);
        }
    });

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
			searchResults = await searchGames(query);
		} catch (error) {
			console.error('Failed to fetch search results:', error);
			searchResults = [];
		} finally {
			isLoading = false;
		}
	}

	async function handleAddGame(game: GameSearchResult) {
        const user = auth.currentUser; 
        const source = $userSettings.dataSource || 'rawg';

        if (!user || !user.uid) {
            alert("You must be logged in.");
            return;
        }

        // LINK MODE: Just return the ID and source
        if (gameToLink && onLinkSuccess) {
            onLinkSuccess(game.id, source);
            showModal = false;
            return;
        }

		// Check duplicates (only for new games)
		const existingGame = $allGames.find(g => 
			(source === 'rawg' && g.rawg_id === game.id) || 
			(source === 'igdb' && g.igdb_id === game.id)
		);

		if (existingGame) {
			alert(`This game is already in your '${existingGame.status}' list.`);
			showModal = false;
			return;
		}

		let detailedGameData: GameDetailsResult | null = null;
		try {
            detailedGameData = await getGameDetails(game.id);
            if (!detailedGameData) {
                throw new Error('Failed to fetch game details.');
            }
		} catch (error) {
			console.error('Error fetching game details:', error);
            alert('Could not fetch game details. Please try again.');
            return;
		}

		try {
			const gameDoc: any = {
				source: source,
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
			};

			if (source === 'rawg') {
				gameDoc.rawg_id = game.id;
			} else {
				gameDoc.igdb_id = game.id;
			}

			await addDoc(collection(db, 'users', user.uid, 'games'), gameDoc);
			console.log(`Game added to ${status} from ${source}:`, game.title);
		} catch (error) {
			console.error('Error adding document: ', error);
		}
		showModal = false;
	}
</script>


<div class="flex justify-between items-center mb-4">
    {#if !gameToLink}
	    <Heading tag="h1" class="capitalize">{status}</Heading>
	    <Button onclick={() => showModal = true}>ADD GAME</Button>
    {/if}
</div>

<Modal title={gameToLink ? `Link "${gameToLink.title}" to ${$userSettings.dataSource?.toUpperCase()}` : "Add a new game"} 
       bind:open={showModal} 
       onclose={() => { if(gameToLink && onLinkSuccess) onLinkSuccess(0, ''); }}
       class="w-full max-w-4xl h-[80vh] flex flex-col">
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
				{@const isGameAdded = $allGames.some(g => g.rawg_id === game.id)}
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
