<script lang="ts">
    import GameSearch from "$lib/components/GameSearch.svelte";
    import GameList from "$lib/components/GameList.svelte";
</script>

<div class="flex flex-col gap-4">
    <GameSearch status="abandoned" />
    <GameList status="abandoned" />
</div>
