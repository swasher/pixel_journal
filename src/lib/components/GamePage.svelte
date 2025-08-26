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

<div class="flex min-h-screen">

<!-- TOC в отдельной колонке -->
<aside class="fixed top-[72px] left-0 w-3xl0 h-[calc(100vh-64px)] overflow-y-auto
 bg-white dark:bg-gray-900">
	<GameTocSidebar games={$gamesForToc} currentStatus={status} />
</aside>

<div class="flex-1 flex flex-col gap-4 p-4">
		<GameSearch {status} />
		<GameList {status} onGamesUpdate={handleGamesUpdate} />
</div>

</div>
