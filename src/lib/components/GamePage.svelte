<script lang="ts">
    import GameSearch from "$lib/components/GameSearch.svelte";
    import GameList from "$lib/components/GameList.svelte";
    import GameTocSidebar from "$lib/components/GameTocSidebar.svelte";
    import { writable, type Writable } from 'svelte/store';
    import { setContext } from 'svelte';
    import { userSettings } from "$lib/stores/userSettings";
    import { Badge } from "flowbite-svelte";

    let { status } = $props<{ status: string }>();

    interface GameDataForToc {
        id: string;
        title: string;
    }

    // Создаем store для списка игр, который будет доступен через контекст
    const gamesForToc: Writable<GameDataForToc[]> = writable([]);
    setContext('gamesForToc', gamesForToc);

    let selectedTags = $state<string[]>([]);

    function toggleTag(tag: string) {
        if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter(t => t !== tag);
        } else {
            selectedTags = [...selectedTags, tag];
        }
    }

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
        
        <!-- Tag Filter Bar -->
        {#if $userSettings.tags.length > 0}
            <div class="flex flex-wrap gap-2 py-2">
                {#each $userSettings.tags as tag}
                    {@const isSelected = selectedTags.includes(tag)}
                    {@const tagColor = $userSettings.tagColors?.[tag] || 'indigo'}
                     <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <div 
                        onclick={() => toggleTag(tag)}
                        role="button"
                        tabindex="0"
                        class="cursor-pointer transition-transform active:scale-95 select-none"
                    >
                        <Badge 
                            color={isSelected ? tagColor as any : 'dark'} 
                            rounded 
                            class={isSelected ? 'ring-2 ring-offset-1 ring-offset-transparent' : 'opacity-60 hover:opacity-100'}
                        >
                            {tag}
                        </Badge>
                    </div>
                {/each}
                 {#if selectedTags.length > 0}
                    <button 
                        class="text-xs text-gray-500 hover:text-red-500 underline ml-2"
                        onclick={() => selectedTags = []}
                    >
                        Clear filters
                    </button>
                {/if}
            </div>
        {/if}

		<GameList {status} onGamesUpdate={handleGamesUpdate} filterTags={selectedTags} />
	</div>
</div>
