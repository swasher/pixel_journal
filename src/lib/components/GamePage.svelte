<script lang="ts">
    import GameSearch from "$lib/components/GameSearch.svelte";
    import GameList from "$lib/components/GameList.svelte";
    import GameTocSidebar from "$lib/components/GameTocSidebar.svelte";
    import { writable, type Writable } from 'svelte/store';
    import { setContext } from 'svelte';

    let { status } = $props<{ status: 'backlog' | 'completed' | 'rejected' | 'abandoned' }>();

    interface GameDataForToc {
        id: string;
        title: string;
    }

    // Создаем store для списка игр, который будет доступен через контекст
    const gamesForToc: Writable<GameDataForToc[]> = writable([]);
    setContext('gamesForToc', gamesForToc);

    // Функция, которая будет вызываться из GameList для обновления списка игр
    function handleGamesUpdate(updatedGames: GameDataForToc[]) {
        gamesForToc.set(updatedGames);
    }
</script>

<!-- TOC в отдельной колонке -->
<!-- Сайдбар позиционируется под навбаром (top-[64px]) и имеет фиксированную ширину w-72 -->
<aside class="fixed top-[64px] left-0 w-72 h-[calc(100vh-64px)] overflow-y-auto overflow-x-hidden p-4 border-r border-gray-200 dark:border-gray-700">
	<GameTocSidebar games={$gamesForToc} currentStatus={status} />
</aside>

<!-- Основной контент. ml-72 нужен, чтобы контент не заезжал под сайдбар. -->
<div class="ml-72 flex flex-col gap-4">
		<GameSearch {status} />
		<GameList {status} onGamesUpdate={handleGamesUpdate} />
</div>
