<script lang="ts">
    import { StarSolid, HeartSolid, CloseCircleSolid } from "flowbite-svelte-icons";
    import { Card, Table, TableBody, TableBodyCell, TableBodyRow } from "flowbite-svelte";

    interface GameData {
        id: string; // Changed to string to match Firestore doc.id
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

    let { game, onEdit } = $props<{ game: GameData; onEdit?: (game: GameData) => void; }>();

    // Классы для стилизации таблицы для уменьшения дублирования в разметке
    const rowClass = "bg-transparent dark:bg-transparent hover:bg-transparent dark:hover:bg-transparent dark:border-gray-600";
    const headerCellClass = "font-semibold text-gray-900 dark:text-white py-1 px-4 w-32"; // Задаем фиксированную ширину w-32
    const dataCellClass = "py-1 px-4";

    // Форматируем дату для отображения
    const formattedDate = game.date_added ? new Date(game.date_added).toLocaleDateString() : 'N/A';
</script>

<Card
    img={game.image_url || 'https://via.placeholder.com/128x128?text=No+Image'}
		classes={{ image: "w-32 h-32 object-cover" }}
    horizontal
    class="relative w-full min-w-0 max-w-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
    onclick={() => onEdit?.(game)}
>
    <div class="flex flex-col p-4 leading-normal flex-grow">
        <h5 class="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">{game.title} ({game.year || 'N/A'})</h5>

        <Table classes={{ div: "relative overflow-x-auto" }} class="text-sm">
            <TableBody>
                {#if game.developer && game.developer.length > 0}
                    <TableBodyRow class={rowClass}>
                        <TableBodyCell class={headerCellClass}>Developer</TableBodyCell>
                        <TableBodyCell class={dataCellClass}>{game.developer.join(', ')}</TableBodyCell>
                    </TableBodyRow>
                {/if}
                {#if game.publisher && game.publisher.length > 0}
                    <TableBodyRow class={rowClass}>
                        <TableBodyCell class={headerCellClass}>Publisher</TableBodyCell>
                        <TableBodyCell class={dataCellClass}>{(Array.isArray(game.publisher)
										? game.publisher
										: (game.publisher === null || game.publisher === undefined)
											? []
											: [String(game.publisher)]
								).join(', ')}</TableBodyCell>
                    </TableBodyRow>
                {/if}
                {#if game.genres && game.genres.length > 0}
                    <TableBodyRow class={rowClass}>
                        <TableBodyCell class={headerCellClass}>Genres</TableBodyCell>
                        <TableBodyCell class={dataCellClass}>{game.genres.join(', ')}</TableBodyCell>
                    </TableBodyRow>
                {/if}
                {#if game.series}
                    <TableBodyRow class={rowClass}>
                        <TableBodyCell class={headerCellClass}>Series</TableBodyCell>
                        <TableBodyCell class={dataCellClass}>{game.series}</TableBodyCell>
                    </TableBodyRow>
                {/if}
                {#if game.play_time !== undefined && game.play_time !== null  && game.play_time !== 0}
                    <TableBodyRow class={rowClass}>
                        <TableBodyCell class={headerCellClass}>Play Time</TableBodyCell>
                        <TableBodyCell class={dataCellClass}>{game.play_time} hours</TableBodyCell>
                    </TableBodyRow>
                {/if}
                {#if game.date_added}
                    <TableBodyRow class={rowClass}>
                        <TableBodyCell class={headerCellClass}>Added</TableBodyCell>
                        <TableBodyCell class={dataCellClass}>{formattedDate}</TableBodyCell>
                    </TableBodyRow>
                {/if}
            </TableBody>
        </Table>

        <div class="flex items-center mt-4">
            {#if game.is_favorite}
                <HeartSolid class="w-5 h-5 text-red-500 me-2" />
            {/if}
            {#if game.user_rating && game.user_rating > 0}
                <StarSolid class="w-5 h-5 text-yellow-400 me-1" />
                <span class="text-gray-700 dark:text-gray-400 font-semibold">{game.user_rating}/5</span>
            {/if}
        </div>

        {#if game.user_note}
            <p class="mt-3 text-sm italic text-gray-600 dark:text-gray-300">Note: {game.user_note}</p>
        {/if}
    </div>
</Card>

