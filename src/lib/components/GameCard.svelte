<script lang="ts">
    import { HeartOutline, HeartSolid, RefreshOutline } from "flowbite-svelte-icons";
    import { Card, Table, TableBody, TableBodyCell, TableBodyRow, Badge, Button, Spinner, Tooltip } from "flowbite-svelte";
    import { GradientButton  } from "flowbite-svelte";
    import { Rating } from "flowbite-svelte";
    import type { GameData } from "$lib/types";
    import { userSettings } from "$lib/stores/userSettings";
    import { db, user } from "$lib/firebase";
    import { doc, updateDoc } from "firebase/firestore";
    import { getGameDetails } from "$lib/apiClient";
    import GameSearch from "./GameSearch.svelte";

    let { game, onEdit } = $props<{
        game: GameData;
        onEdit?: (game: GameData) => void;
    }>();

    let isSyncing = $state(false);
    let showLinkModal = $state(false);

    // Классы для стилизации таблицы для уменьшения дублирования в разметке
    const rowClass = "bg-transparent dark:bg-transparent hover:bg-transparent dark:hover:bg-transparent dark:border-gray-600";
    const headerCellClass = "font-semibold text-gray-900 dark:text-white py-1 px-4 w-32"; // Задаем фиксированную ширину w-32
    const dataCellClass = "py-1 px-4";

    // Форматируем дату для отображения
    const formattedDate = game.date_added ? new Date(game.date_added).toLocaleDateString() : 'N/A';

    function truncate(str: string | undefined | null, maxLength: number): string {
        if (!str) return '';
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
    }

    async function syncGameData(e?: MouseEvent) {
        if (e) e.stopPropagation();
        if (isSyncing || !$user) return;

        // 1. Use the CURRENT source from global settings
        const targetSource = $userSettings.dataSource || 'rawg';
        
        // 2. Find the ID for this source.
        let targetId: number | undefined = targetSource === 'rawg' ? game.rawg_id : game.igdb_id;

        if (!targetId) {
            // Smart Linking: Open search instead of alert
            showLinkModal = true;
            return;
        }

        isSyncing = true;
        try {
            const details = await getGameDetails(targetId);
            if (!details) throw new Error("No details returned from API");

            const gameRef = doc(db, 'users', $user.uid, 'games', game.id);
            const updateData: any = {
                title: details.title || game.title,
                year: details.year || game.year,
                image_url: details.image_url || game.image_url,
                genres: details.genres || [],
                developer: details.developer || [],
                publisher: details.publisher || [],
                series: details.series || '',
                source: targetSource
            };

            await updateDoc(gameRef, updateData);
            console.log(`Game synced successfully via ${targetSource}:`, game.title);
            
        } catch (error: any) {
            console.error("Sync error:", error);
            alert(`Failed to sync: ${error.message}`);
        } finally {
            isSyncing = false;
        }
    }

    async function handleLinkSuccess(externalId: number, source: string) {
        showLinkModal = false;
        if (!externalId || !$user) return;

        try {
            const gameRef = doc(db, 'users', $user.uid, 'games', game.id);
            const updateData: any = {
                source: source
            };
            if (source === 'rawg') updateData.rawg_id = externalId;
            else if (source === 'igdb') updateData.igdb_id = externalId;

            await updateDoc(gameRef, updateData);
            
            // Now that we have the ID, run sync automatically
            setTimeout(() => syncGameData(), 100);

        } catch (error) {
            console.error("Error linking game:", error);
            alert("Failed to link game.");
        }
    }

</script>

{#if showLinkModal}
    <GameSearch 
        status={game.status} 
        gameToLink={game} 
        onLinkSuccess={handleLinkSuccess} 
    />
{/if}

<Card
    img={game.image_url || 'https://via.placeholder.com/128x128?text=No+Image'}
		classes={{ image: "w-32 h-32 object-cover" }}
    horizontal
    class="relative w-full min-w-0 max-w-none cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
    onclick={() => onEdit?.(game)}
>
    <div class="flex flex-col p-4 leading-normal flex-grow">
        <div class="flex items-baseline gap-2 mb-2">
<!--            <h5 class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {game.title}  <Badge class="text-[12px] opacity-90 ">{game.year || 'N/A'}</Badge>
                &lt;!&ndash;({game.year || 'N/A'})&ndash;&gt;
            </h5>-->

            <h5 class="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
                <span>{game.title}</span>
<!--
                <Badge class="text-[14px] opacity-90 align-middle bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{game.year || 'N/A'}</Badge>
-->
                <Badge color="gray" class="text-[13px] font-medium px-2 py-0.5 rounded-md align-middle opacity-90 tracking-wide">
                    {game.year || 'N/A'}
                </Badge>
            </h5>

            {#if game.tags && game.tags.length > 0}
                <div class="flex flex-wrap gap-1">
                    {#each game.tags as tag (tag)}
                        <Badge color={$userSettings.tagColors?.[tag] as any || 'indigo'} class="text-xs">{tag}</Badge>
                    {/each}
                </div>
            {/if}
        </div>

        <Table classes={{ div: "relative overflow-x-auto" }} class="text-sm">
            <TableBody>
                {#if game.developer && game.developer.length > 0}
                    <TableBodyRow class={rowClass}>
                        <TableBodyCell class={headerCellClass}>Developer</TableBodyCell>
                        <TableBodyCell class={dataCellClass}>{truncate(game.developer.join(', '), 82)}</TableBodyCell>
                    </TableBodyRow>
                {/if}
                {#if game.publisher && game.publisher.length > 0}
                    <TableBodyRow class={rowClass}>
                        <TableBodyCell class={headerCellClass}>Publisher</TableBodyCell>
                        <TableBodyCell class={dataCellClass}>{truncate((Array.isArray(game.publisher)
										? game.publisher
										: (game.publisher === null || game.publisher === undefined)
											? []
											: [String(game.publisher)]
								).join(', '), 82)}</TableBodyCell>
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

        <div class="flex items-center mt-auto pt-4">
            <div class="flex items-center gap-2">
                <div class="flex items-center">
                    {#if game.is_favorite}
                        <HeartSolid class="w-5 h-5 text-red-500"/>
                    {:else}
                        <HeartOutline class="w-5 h-5 text-gray-500"/>
                    {/if}
                </div>

								<div class="divider"></div>

                {#if game.user_rating && game.user_rating > 0}
                    <div class="flex items-center">
                        <Rating id="example-1" total={5} size={20} rating={game.user_rating} />
                    </div>
                {/if}
            </div>

            <div class="ml-auto flex items-center gap-2">
                {#if game.source}
                    <Badge class="text-[10px] uppercase opacity-50">{game.source}</Badge>
                {/if}
                <Button size="xs" color="light" class="!p-1.5" onclick={syncGameData} disabled={isSyncing} outline>
                    {#if isSyncing}
                        <Spinner size="3" />
                    {:else}
                        <RefreshOutline class="w-3.5 h-3.5" />
                    {/if}
                </Button>
                <Tooltip>Sync details from {$userSettings.dataSource?.toUpperCase() || 'RAWG'}</Tooltip>

                <Button size="xs" href="/notes/{game.id}" onclick={(e) => e.stopPropagation()} outline>
                    Заметка
                </Button>
            </div>
        </div>

        {#if game.user_note}
            <p class="mt-3 text-sm italic text-gray-600 dark:text-gray-300">{game.user_note}</p>
        {/if}
    </div>
</Card>


<style>
    .divider {
        width: 1px;
        height: 20px; /* Установите высоту, равную высоте соседних элементов */
        background-color: var(--color-secondary-800); /* Цвет разделителя */
    }
</style>