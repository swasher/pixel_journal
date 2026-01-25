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
    let filteredGames = $state<GameData[]>([]);

    const currentUser = $derived(user); // Подписываемся на user store

    $effect(() => {
        filteredGames = games.filter(game =>
            game.title.toLowerCase().includes($searchQuery.toLowerCase())
        );
    });

    $effect(() => {
        onGamesUpdate(filteredGames.map(g => ({ id: g.id, title: g.title })));
    });

    $effect(() => {
			// Этот эффект будет перезапускаться при изменении пользователя, статуса, глобального поиска или текста поиска
			if (!$currentUser) {
            games = [];
            isLoading = false;
            return;
        }

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

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedGames: GameData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as DocumentData;
                fetchedGames.push({
                    id: doc.id,
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
                    
                    tags: data.tags || [] // Добавляем tags
                });
            });

            // Sort games: newest first (descending date_added)
            fetchedGames.sort((a, b) => {
                const dateA = a.date_added ? a.date_added.getTime() : 0;
                const dateB = b.date_added ? b.date_added.getTime() : 0;
                if (dateB !== dateA) {
                    return dateB - dateA;
                }
                // Fallback to title if dates are equal or missing
                return a.title.localeCompare(b.title);
            });

            games = fetchedGames;
            isLoading = false;
            error = null;
        }, (e) => {
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