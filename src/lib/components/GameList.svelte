<script lang="ts">
    import GameCard from "$lib/components/GameCard.svelte";
    import GameEditModal from "./GameEditModal.svelte";
    import { db, user } from "$lib/firebase"; // Импортируем user store
    import { collection, query, where, onSnapshot, type DocumentData, type QueryConstraint } from "firebase/firestore";
    import { Spinner } from "flowbite-svelte";
    import { searchQuery } from "$lib/stores/searchQuery";
    import { isGlobalSearch } from "$lib/stores/searchScope";
    import type { GameData } from "$lib/types";

    let { status, onGamesUpdate } = $props<{ status: string; onGamesUpdate: (games: GameDataForToc[]) => void }>();

    interface GameDataForToc {
        id: string;
        title: string;
    }


    let games = $state<GameData[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let editingGame = $state<GameData | null>(null);

    const currentUser = $derived(user); // Подписываемся на user store

    const filteredGames = $derived.by(() => {
        console.log('GameList: $derived running. Input games count:', games.length);
        const result = games.filter(game =>
            game.title.toLowerCase().includes($searchQuery.toLowerCase())
        );
        console.log('GameList: $derived finished. Output games count:', result.length);
        return result;
    });

    $effect(() => {
        onGamesUpdate(filteredGames.map(g => ({ id: g.id, title: g.title })));
    });

    $effect(() => {
        console.log(`GameList: Effect triggered. currentUser:`, currentUser, 'Status:', status);

			// Этот эффект будет перезапускаться при изменении пользователя, статуса, глобального поиска или текста поиска
			if (!$currentUser) {
            console.log('GameList: User not logged in or not yet initialized. Clearing games.');
            games = [];
            isLoading = false;
            return;
        }

        console.log('GameList: User is logged in. UID:', $currentUser.uid);
        isLoading = true;

        const gamesCollectionRef = collection(db, 'users', $currentUser.uid, 'games');

        const queryConstraints: QueryConstraint[] = [];

        const isGlobal = $isGlobalSearch;
        const queryText = $searchQuery;
        const currentStatus = status; // Make status a dependency of the effect

        if (!isGlobal || !queryText) {
            queryConstraints.push(where("status", "==", currentStatus));
        }

        const q = query(gamesCollectionRef, ...queryConstraints);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('GameList: Firestore snapshot received with docChanges.');
            snapshot.docChanges().forEach((change) => {
                const data = change.doc.data() as DocumentData;
                const changedGame: GameData = {
                    id: change.doc.id,
                    rawg_id: data.rawg_id,
                    title: data.title,
                    year: data.year,
                    image_url: data.image_url,
                    developer: data.developer || [],
                    publisher: data.publisher || [],
                    genres: data.genres || [],
                    series: data.series,
                    user_note: data.user_note,
                    is_favorite: data.is_favorite,
                    user_rating: data.user_rating,
                    play_time: data.play_time,
                    markdown_content: data.markdown_content,
                    status: data.status,
                    date_added: data.date_added ? data.date_added.toDate() : undefined,
                    tags: data.tags || []
                };

                if (change.type === "added") {
                    console.log("GameList: Game added:", changedGame.title);
                    // Add to array, but avoid duplicates that can happen with fast re-renders
                    if (!games.some(g => g.id === changedGame.id)) {
                        games = [...games, changedGame];
                    }
                }
                if (change.type === "modified") {
                    console.log("GameList: Game modified:", changedGame.title, "New Rating:", changedGame.user_rating);
                    const index = games.findIndex(g => g.id === changedGame.id);
                    if (index !== -1) {
                        // Create a new array with the updated item
                        games = [
                            ...games.slice(0, index),
                            changedGame,
                            ...games.slice(index + 1)
                        ];
                    }
                }
                if (change.type === "removed") {
                    console.log("GameList: Game removed:", changedGame.title);
                    games = games.filter(g => g.id !== changedGame.id);
                }
            });

            // Sort games by date added after processing changes
            games.sort((a, b) => (b.date_added?.getTime() || 0) - (a.date_added?.getTime() || 0));


            isLoading = false;
            error = null;
        }, (e) => {
            console.error("GameList: Error fetching games: ", e);
            error = "Failed to load games. Check Firestore rules and connection.";
            isLoading = false;
        });

        return () => unsubscribe();
    });

    function handleEditGame(game: GameData) {
        editingGame = game;
    }
</script>

<div class="flex flex-col gap-4">
    {#if isLoading}
        <div class="flex justify-center items-center h-48">
            <Spinner size=12 />
        </div>
    {:else if error}
        <div class="text-center text-red-500 dark:text-red-400">
            <p>{error}</p>
        </div>
    {:else if games.length === 0}
        <div class="text-center text-gray-500 dark:text-gray-400">
            <p>No games in your {status} list yet. Add some!</p>
        </div>
    {:else if filteredGames.length === 0}
        <div class="text-center text-gray-500 dark:text-gray-400">
            <p>No games found matching your search.</p>
        </div>
    {:else}
        <!-- Обертка для ограничения ширины и центрирования была перенесена в GamePage.svelte -->
        <div class="grid grid-cols-1 gap-4">
            {#each filteredGames as game (game.id + game.user_rating)}
                <div id="game-{game.id}">
                    <GameCard {game} onEdit={handleEditGame} />
                </div>
            {/each}
        </div>
    {/if}

    {#if editingGame}
        <GameEditModal game={editingGame} onClose={() => editingGame = null} />
    {/if}
</div>