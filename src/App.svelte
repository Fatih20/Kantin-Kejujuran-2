<script lang="ts">
  import StartPage from "./components/StartPage.svelte";
  import Store from "./components/Store.svelte";
  import { appState } from "./stores";
  import { onMount } from "svelte";
  import { backendAddress } from "./config";
  // import { config } from "dotenv";

  onMount(() => {
    console.log(import.meta.env.VITE_CLIENT_ID);
  });
</script>

<main>
  {#if $appState === "startPage"}
    <StartPage />
  {:else if $appState === "trade" || $appState === "add"}
    <Store />
  {/if}
</main>

<style>
  main {
    width: 100%;
  }
</style>
