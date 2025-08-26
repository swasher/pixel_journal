<script lang="ts">
    import GameCard from "$lib/components/GameCard.svelte";
    import GameEditModal from "./GameEditModal.svelte";
    import DeleteConfirmationModal from "./DeleteConfirmationModal.svelte"; // Импортируем новый компонент
    import { db } from "$lib/firebase";
    import { collection, query, where, onSnapshot, doc, deleteDoc, type DocumentData } from "firebase/firestore";
    import { Spinner } from "flowbite-svelte";

    let { status, onGamesUpdate } = $props<{ status: 'backlog' | 'completed' | 'rejected' | 'abandoned'; onGamesUpdate: (games: GameDataForToc[]) => void }>();

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
        date_added?: Date; // Добавляем date_added
    }

    interface GameDataForToc {
        id: string;
        title: string;
    }

    let games = $state<GameData[]>([]);
    let isLoading = $state(true);
    let error = $state<string | null>(null);
    let editingGame = $state<GameData | null>(null); // Состояние для редактируемой игры

    // Состояние для модального окна подтверждения удаления
    let showDeleteConfirmation = $state(false);
    let gameToDeleteId = $state<string | null>(null);
    let gameToDeleteTitle = $state<string | null>(null);

    $effect(() => {
        const q = query(collection(db, "games"), where("status", "==", status));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedGames: GameData[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data() as DocumentData;
                fetchedGames.push({
                    id: doc.id,
                    rawg_id: data.rawg_id, // Извлекаем rawg_id
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
                    date_added: data.date_added ? data.date_added.toDate() : undefined, // Преобразуем Timestamp в Date
                });
            });
            games = fetchedGames;
            isLoading = false;
            error = null;

            // Обновляем список игр для TOC
            onGamesUpdate(fetchedGames.map(g => ({ id: g.id, title: g.title })));
        }, (e) => {
            console.error("Error fetching games: ", e);
            error = "Failed to load games.";
            isLoading = false;
        });

        return () => unsubscribe();
    });

    function handleEditGame(game: GameData) {
        editingGame = game;
    }

    function handleDeleteGame(gameId: string, gameTitle: string) {
        gameToDeleteId = gameId;
        gameToDeleteTitle = gameTitle;
        showDeleteConfirmation = true;
    }

    async function confirmDelete() {
        if (gameToDeleteId) {
            try {
                await deleteDoc(doc(db, "games", gameToDeleteId));
                console.log("Game deleted successfully!");
            } catch (error) {
                console.error("Error deleting document: ", error);
            }
        }
        showDeleteConfirmation = false;
        gameToDeleteId = null;
        gameToDeleteTitle = null;
    }

    function cancelDelete() {
        showDeleteConfirmation = false;
        gameToDeleteId = null;
        gameToDeleteTitle = null;
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
    {:else}
        <!-- Обертка для ограничения ширины и центрирования была перенесена в GamePage.svelte -->
        <div class="grid grid-cols-1 gap-4">
            {#each games as game (game.id)}
                <div id="game-{game.id}">
                    <GameCard game={game} onEdit={handleEditGame} onDelete={() => handleDeleteGame(game.id, game.title)} />
                </div>
            {/each}
        </div>
    {/if}

    {#if editingGame}
        <GameEditModal game={editingGame} onClose={() => editingGame = null} />
    {/if}

    {#if showDeleteConfirmation}
        <DeleteConfirmationModal
            open={showDeleteConfirmation}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
            message={`Are you sure you want to delete "${gameToDeleteTitle}"? This action cannot be undone.`}
        />
    {/if}
</div>
