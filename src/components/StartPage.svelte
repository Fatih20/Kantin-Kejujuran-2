<script lang="ts">
  import { appState } from "../stores";
  // function sendGameHasStarted() {
  //   dispatch("gameStarted");
  // }
</script>

<head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" />
  <link
    href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap"
    rel="stylesheet"
  />
</head>

<main>
  <div id="content-container">
    <h1 id="title">Honest<br />Canteen</h1>
    <!-- <div class="spacer" /> -->
    <div id="button-container">
      <button
        class="option-container"
        on:click={async () => {
          appState.set("trade");
        }}
      >
        <h3 class="start-button-title">Start Trading</h3>
        <!-- <p>Save your game and high score on this device</p> -->
      </button>
    </div>
  </div>
</main>

<style>
  main {
    align-items: center;
    background-color: rgb(var(--primary-color));
    bottom: 0;
    color: rgb(var(--text-on-primary-element-color));
    display: flex;
    flex-direction: column;
    height: 100vh;
    justify-content: center;
    left: 0;
    width: 100%;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 100;
  }
  main * {
    color: rgb(var(--text-on-primary-element-color));
  }
  #content-container {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.5em;
    height: 300px;
    /* border: solid 1px white; */
  }
  #button-container {
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 1.5em;
    /* border: solid 1px white; */
  }
  #button-container button {
    margin: 0;
  }

  .option-container {
    align-items: center;
    background-color: rgba(var(--primary-color), 0);
    border: none;
    box-sizing: content-box;
    border-radius: var(--button-radius);
    color: rgb(var(--text-on-primary-element-color));
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    justify-content: center;
    /* max-width: 200px; */
    padding: 0.25em;
    text-align: center;
    transition: all 0.25s ease-in-out;
  }

  .option-container:hover {
    background-color: rgb(var(--text-on-primary-element-color));
  }

  .option-container:hover .start-button-title {
    color: rgba(var(--primary-color), 1);
  }

  #title {
    font-family: "Kalam", cursive;
    text-align: center;
    font-size: 4em;
    font-weight: 700;
    line-height: 1.25em;
  }
  .spacer {
    flex-grow: 1;
  }
  .start-button-title {
    font-size: 1.75em;
    font-weight: 700;
    transition: all 0.1s ease-in-out;
    width: 100%;
  }
  /* .start-button:hover {
      background-color: rgb(var(--secondary-color));
      color: rgb(var(--text-on-secondary-selected-element-color));
      font-size: 2em;
    } */
  .clicked {
    background-color: rgb(var(--secondary-active-color)) !important;
    color: rgb(var(--text-on-secondary-active-element-color)) !important;
    transition: all 0.25s ease-in-out !important;
  }
</style>
