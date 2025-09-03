<script lang="ts">
	import { Listgroup } from 'flowbite-svelte';

	interface GameDataForToc {
		id: string;
		title: string;
	}

	let { games } = $props<{ games: GameDataForToc[] }>();

	function scrollToGame(gameId: string) {
		const element = document.getElementById(`game-${gameId}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	}

	// Create a reactive list for the Listgroup component
	let listItems = $derived(
		games.map((game) => ({
			name: game.title,
			onclick: () => scrollToGame(game.id),
			class: 'cursor-pointer truncate !p-2 !text-sm'
		}))
	);
</script>

<!--<aside class="w-72 h-full !static p-0 scrollbar-thin overflow-y-auto">-->
{#if games.length === 0}
	<p class="p-2 text-gray-500 dark:text-gray-400 text-xs">No games to display.</p>
{:else}
<!--	<Listgroup active  items={listItems} class="!border-none" />-->
	<ul class="space-y-1">
		{#each listItems as item (item)}
			<li>
				<button
					onclick={item.onclick}

				class="block w-full text-left px-2 py-2 rounded-md cursor-pointer truncate text-sm font-medium
				text-gray-700 hover:bg-gray-100 hover:text-primary-700
				dark:text-secondary-400 dark:hover:bg-primary-300 dark:hover:text-primary-800
"

				>
					{item.name}
				</button>
			</li>
		{/each}
	</ul>
{/if}