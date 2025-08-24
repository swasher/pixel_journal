<script lang="ts">
    import { StarSolid, HeartSolid, EditSolid, CloseCircleSolid } from "flowbite-svelte-icons";

    interface GameData {
        id: string; // Changed to string to match Firestore doc.id
        title: string;
        year: number | null;
        image_url: string;
        developer?: string[];
        publisher?: string;
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

    let { game, onclick, onEdit, onDelete } = $props<{ game: GameData; onclick?: () => void; onEdit?: (game: GameData) => void; onDelete?: (gameId: string) => void }>();

    // Форматируем дату для отображения
    const formattedDate = game.date_added ? new Date(game.date_added).toLocaleDateString() : 'N/A';

    function handleEditClick(event: MouseEvent) {
        event.stopPropagation(); // Предотвращаем срабатывание onclick на самой карточке
        if (onEdit) {
            onEdit(game);
        }
    }

    function handleDeleteClick(event: MouseEvent) {
        event.stopPropagation(); // Предотвращаем срабатывание onclick на самой карточке
        if (onDelete) {
            onDelete(game.id);
        }
    }
</script>

<div
    class="relative flex bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 w-full"
    onclick={onclick}
    role="button"
    tabindex="0"
>
    <img class="object-cover w-32 h-full rounded-s-lg" src={game.image_url || 'https://via.placeholder.com/128x128?text=No+Image'}
         alt={game.title} />
    <div class="flex flex-col justify-between p-4 leading-normal flex-grow">
        <h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">{game.title} ({game.year || 'N/A'})</h5>
        {#if game.developer && game.developer.length > 0}
            <p class="font-normal text-gray-700 dark:text-gray-400">Developer: {game.developer.join(', ')}</p>
        {/if}
        {#if game.publisher}
            <p class="font-normal text-gray-700 dark:text-gray-400">Publisher: {game.publisher}</p>
        {/if}
        {#if game.genres && game.genres.length > 0}
            <p class="font-normal text-gray-700 dark:text-gray-400">Genres: {game.genres.join(', ')}</p>
        {/if}
        {#if game.series}
            <p class="font-normal text-gray-700 dark:text-gray-400">Series: {game.series}</p>
        {/if}
        {#if game.play_time !== undefined}
            <p class="font-normal text-gray-700 dark:text-gray-400">Play Time: {game.play_time} hours</p>
        {/if}
        {#if game.date_added}
            <p class="font-normal text-gray-700 dark:text-gray-400">Added: {formattedDate}</p>
        {/if}

        <div class="flex items-center mt-2">
            {#if game.is_favorite}
                <HeartSolid class="w-5 h-5 text-red-500 me-1" />
            {/if}
            {#if game.user_rating && game.user_rating > 0}
                <StarSolid class="w-5 h-5 text-yellow-400 me-1" />
                <span class="text-gray-700 dark:text-gray-400">{game.user_rating}/5</span>
            {/if}
        </div>

        {#if game.user_note}
            <p class="mt-3 text-sm italic text-gray-600 dark:text-gray-300">Note: {game.user_note}</p>
        {/if}
    </div>
    <div class="absolute top-2 right-2 flex gap-1">
        <button class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                onclick={handleEditClick}
                aria-label="Edit game">
            <EditSolid class="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
        <button class="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500"
                onclick={handleDeleteClick}
                aria-label="Delete game">
            <CloseCircleSolid class="w-5 h-5 text-red-500 dark:text-red-400" />
        </button>
    </div>
</div>
