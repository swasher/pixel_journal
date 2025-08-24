<script lang="ts">
    import { Sidebar, SidebarGroup, SidebarItem } from "flowbite-svelte";

    interface GameDataForToc {
        id: string;
        title: string;
    }

    // let { games, currentStatus } = $props<{ games: GameDataForToc[]; currentStatus: string }>();
		export let games: GameDataForToc[];
		export let currentStatus: string;

    function scrollToGame(gameId: string) {
        const element = document.getElementById(`game-${gameId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
</script>

<!--<Sidebar
    alwaysOpen
    backdrop={false}
>
    <SidebarGroup>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">{currentStatus} Games</h3>
        {#if games.length === 0}
            <p class="text-gray-500 dark:text-gray-400 text-sm">No games to display.</p>
        {:else}
            {#each games as game (game.id)}
                <SidebarItem label={game.title} onclick={() => scrollToGame(game.id)} class="cursor-pointer" />
            {/each}
        {/if}
    </SidebarGroup>
</Sidebar>-->


<div class="flex flex-row-reverse min-h-screen">
	<!-- Sidebar справа -->
	<Sidebar
		alwaysOpen
		backdrop={false}
		class="w-96 sticky top-0 h-screen overflow-y-auto"
	>
		<SidebarGroup>
			<h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
				{currentStatus} Games
			</h3>
			{#if games.length === 0}
				<p class="text-gray-500 dark:text-gray-400 text-sm">No games to display.</p>
			{:else}
				{#each games as game (game.id)}
					<SidebarItem
						label={game.title}
						onclick={() => scrollToGame(game.id)}
						class="cursor-pointer"
					/>
				{/each}
			{/if}
		</SidebarGroup>
	</Sidebar>

	<!-- Основной контент -->
	<main class="flex-1 p-6">
		<!-- Здесь твои блоки с id="game-..." -->

	</main>
</div>