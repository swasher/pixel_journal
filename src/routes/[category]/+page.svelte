<script lang="ts">
  import GamePage from '$lib/components/GamePage.svelte';
  import { page } from '$app/stores';

  let status = $derived($page.params.category);
</script>

<GamePage {status} />
