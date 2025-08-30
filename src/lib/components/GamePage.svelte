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


<!--
РАБОТАЛО С BAK
<GameTocSidebar games={$gamesForToc} currentStatus={status} />
-->


<aside class="fixed top-20 w-80 h-[calc(100vh-5rem)] flex-shrink-0 overflow-y-auto  border-r p-1
 scrollbar-thin
">
		<GameTocSidebar games={$gamesForToc} currentStatus={status} />
</aside>


<!-- Основной контент. ml-72 нужен, чтобы контент не заезжал под сайдбар. -->
<div class="ml-72">
	<!-- Эта обертка центрирует контент и задает ему максимальную ширину в 896px (max-w-4xl) -->
	<div class="w-full max-w-4xl mx-auto flex flex-col gap-4">
		<GameSearch {status} />
		<GameList {status} onGamesUpdate={handleGamesUpdate} />
	</div>
</div>
