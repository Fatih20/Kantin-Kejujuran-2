<script lang="ts">
  import Header from "./Header.svelte";
  import Shelf from "./Shelf.svelte";
  import Footer from "./Footer.svelte";
  import { appState } from "../stores";
  import NewItemForm from "./NewItemForm.svelte";

  let formKey = {};

  function resetForm() {
    formKey = {};
  }
</script>

<main>
  <Header />
  {#if $appState === "add"}
    {#key formKey}
      <NewItemForm on:reset={resetForm} />
    {/key}
  {:else if $appState === "trade"}
    <Shelf />
    <Footer />
  {/if}
</main>

<style>
  main {
    align-items: center;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100vh;
    justify-content: center;
    width: 100%;
  }
</style>
