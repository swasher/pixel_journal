<script lang="ts">
	import { Sidebar, SidebarGroup, SidebarItem } from 'flowbite-svelte';

	interface GameDataForToc {
		id: string;
		title: string;
	}

	// let { games, currentStatus } = $props<{ games: GameDataForToc[]; currentStatus: string }>();
	// export let games: GameDataForToc[];
	// export let currentStatus: string;
	let { games, currentStatus } = $props<{ games: GameDataForToc[]; currentStatus: string }>();

	function scrollToGame(gameId: string) {
		const element = document.getElementById(`game-${gameId}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}
</script>


<Sidebar
	alwaysOpen
	backdrop={false}
	class="fixed top-[72px] w-82  !p-0 left-0
		border-r  border-gray-200 dark:border-gray-700

	">

<!--	scrollbar-thin overflow-y-auto  overflow-x-hidden-->

	<SidebarGroup>
		{#if games.length === 0}
			<p class="text-gray-500 dark:text-gray-400 text-xs">No games to display.</p>
		{:else}
			{#each games as game (game.id)}
				<SidebarItem
					label={game.title}
					onclick={() => scrollToGame(game.id)}
					class="cursor-pointer truncate"
				/>
			{/each}
		{/if}
	</SidebarGroup>
</Sidebar>
