<script lang="ts">
    import GameCard from "$lib/components/GameCard.svelte";
    import GameEditModal from "./GameEditModal.svelte";
    import { db, user } from "$lib/firebase"; // Импортируем user store
    import { collection, query, where, onSnapshot, type DocumentData, type QueryConstraint } from "firebase/firestore";
    import { Spinner } from "flowbite-svelte";
    import { searchQuery } from "$lib/stores/searchQuery";
    import { isGlobalSearch } from "$lib/stores/searchScope";

    let { status, onGamesUpdate } = $props<{ status: 'backlog' | 'completed' | 'rejected' | 'abandoned'; onGamesUpdate: (games: GameDataForToc[]) => void }>();

    // ... (интерфейсы остаются теми же)
    interface GameData {
        id: string;
        rawg_id: number;
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
        userId?: string; // Добавляем userId в интерфейс
    }

    interface GameDataForToc {
        id: string;
        title: string;
    }


    let games = $state<GameData[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let editingGame = $state<GameData | null>(null);

    const currentUser = $derived(user); // Подписываемся на user store

    const filteredGames = $derived(games.filter(game =>
        game.title.toLowerCase().includes($searchQuery.toLowerCase())
    ));

    $effect(() => {
        onGamesUpdate(filteredGames.map(g => ({ id: g.id, title: g.title })));
    });

    $effect(() => {
        console.log(`GameList: Effect triggered. currentUser:`, currentUser);

			// Этот эффект будет перезапускаться при изменении пользователя, статуса, глобального поиска или текста поиска
			if (!$currentUser) {
            console.log('GameList: User not logged in or not yet initialized. Clearing games.');
            games = [];
            isLoading = false;
            return;
        }

        console.log('GameList: User is logged in. UID:', $currentUser.uid);
        isLoading = true;
        const queryConstraints: QueryConstraint[] = [
            where("userId", "==", $currentUser.uid) // всегда фильтруем по userId
        ];

        const isGlobal = $isGlobalSearch;
        const queryText = $searchQuery;

        if (!isGlobal || !queryText) {
            queryConstraints.push(where("status", "==", status));
        }

        const q = query(collection(db, "Games"), ...queryConstraints);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log('GameList: Firestore snapshot received. Docs:', querySnapshot.docs.length);
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
                    userId: data.userId
                });
            });
            games = fetchedGames;
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
            {#each filteredGames as game (game.id)}
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