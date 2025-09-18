<script lang="ts">
    import GamePage from '$lib/components/GamePage.svelte';
    import { page } from '$app/stores';
    import { userSettings } from "$lib/stores/userSettings";
    import { derived } from "svelte/store";

    const correctCaseCategory = derived([page, userSettings], ([$page, $userSettings]) => {
        const categoryParam = $page.params.category;
        if (!$userSettings.categories) return null; // Не рендерим, пока категории не загружены

        return $userSettings.categories.find(c => c.toLowerCase() === categoryParam.toLowerCase()) || categoryParam;
    });

</script>

{#if $correctCaseCategory}
    <GamePage status={$correctCaseCategory} />
{/if}