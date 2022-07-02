<script lang="ts">
  import { appState } from "../stores";
</script>

<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap"
    rel="stylesheet"
  />
  <script
    src="https://kit.fontawesome.com/31a5898fa1.js"
    crossorigin="anonymous"></script>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/css/all.min.css"
    integrity="sha512-YWzhKL2whUzgiheMoBFwW8CKV4qpHQAEuvilg9FAn5VJUDwKZZxkJNuGM4XkWuk94WCrrwslk8yWNGmY1EduTA=="
    crossorigin="anonymous"
    referrerpolicy="no-referrer"
  />
</head>

<main class:header-in-add={$appState === "add"}>
  <button
    class="header-button add-button"
    class:header-button-disabled={$appState === "add"}
  >
    <!-- <i class="fa-solid fa-plus" /> -->
  </button>
  <h1 class="title" on:click={() => appState.set("startPage")}>HC</h1>
  <button
    class="header-button add-button"
    on:click={() => appState.set("add")}
    class:header-button-disabled={$appState === "add"}
  >
    <i class="fa-solid fa-plus" />
  </button>
</main>

<style>
  main {
    align-items: center;
    align-self: flex-start;
    background-color: rgb(var(--primary-color));
    box-sizing: border-box;
    border-bottom: solid 2px rgb(var(--primary-border-color));
    color: rgb(var(--text-on-primary-element-color));
    display: flex;
    height: 50px;
    justify-content: space-between;
    padding: 0 0.5em;
    width: 100%;

    /* border: solid 1px white; */
  }

  .header-in-add {
    justify-content: center;
  }

  .title {
    /* align-self: center; */
    cursor: pointer;
    font-family: "Kalam", cursive;
    font-size: 1.7 5em;
    user-select: none;

    /* border: solid 1px black; */
  }

  .header-button {
    align-self: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0);
    border: none;
    color: rgb(var(--text-on-primary-element-color));
    display: flex;
    justify-content: center;
    font-size: 1.25em;
    margin: 0;
    padding: 0;
    width: 30px;
    transition: transform 0.25s ease-in-out;

    /* border: solid 1px black; */
  }

  .header-button-disabled {
    display: none;
  }

  .header-button:hover {
    transform: rotate(180deg);
  }
</style>
