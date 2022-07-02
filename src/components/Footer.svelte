<script lang="ts">
  import { storeBalance } from "../stores";
  import type {
    PossibleFooterState,
    PossibleInputProblem,
  } from "../utilities/types";
  import { priceDenominator } from "../utilities/utilities";

  let footerState = "default" as PossibleFooterState;
  let inputtedNumber: number | undefined = undefined;
  let validInput = true;
  let inputProblem = "none" as PossibleInputProblem;

  function reset() {
    inputtedNumber = undefined;
    footerState = "default";
  }

  $: {
    if (footerState === "take" && inputtedNumber > $storeBalance) {
      validInput = false;
      inputProblem = "overdraw";
    } else if (inputtedNumber === null) {
      validInput = false;
      inputProblem = "NaN";
    } else if (inputtedNumber < 0) {
      validInput = false;
      inputProblem = "negative";
    } else {
      validInput = true;
    }
  }

  function handleOperate() {
    let completeOperation = true;
    if (!validInput) {
      return;
    }
    if (footerState === "give") {
      storeBalance.add(inputtedNumber);
    } else if (footerState === "take") {
      storeBalance.subtract(inputtedNumber);
    }

    if (completeOperation) {
      reset();
    }
  }
</script>

<head>
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

<main>
  {#if !validInput}
    {#if inputProblem === "overdraw"}
      <p class="warning-text">
        You can't withdraw more than the canteen balance
      </p>
    {:else if inputProblem === "NaN" || inputProblem === "negative"}
      <p class="warning-text">Please enter a positive number</p>
    {/if}
  {/if}
  <div class="footer-container">
    {#if footerState === "default"}
      <button class="money-button" on:click={() => (footerState = "take")}>
        <i class="fa-solid fa-right-from-bracket fa-rotate-270 money-icon" />
      </button>
      <!-- <div class="spacer" /> -->

      <div class="money-container">
        <div class="money-container-second">
          <i class="fa-solid fa-money-bill-wave money-icon" />
          <p class="store-balance">{priceDenominator($storeBalance)}</p>
        </div>
      </div>
      <!-- <div class="spacer" /> -->
      <button class="money-button" on:click={() => (footerState = "give")}>
        <i class="fa-solid fa-right-to-bracket fa-rotate-90 money-icon" />
      </button>
    {:else}
      <button class="operate-button cancel-button" on:click={reset}>
        <i class="fa-solid fa-share fa-flip-horizontal money-icon" /></button
      >
      <div class="input-container">
        <p>Rp</p>
        <input
          class="input-operator"
          type="number"
          min="0"
          placeholder={"0"}
          bind:value={inputtedNumber}
          on:keydown={({ key }) => {
            if (key == "Enter") {
              handleOperate();
              return;
            }
          }}
          on:keyup={() => {
            console.log(inputtedNumber);
          }}
        />
      </div>
      <button
        class="operate-button"
        class:invalid-operate-button={!validInput}
        on:click={handleOperate}
      >
        {#if footerState === "give"}
          <i class="fa-solid fa-right-to-bracket fa-rotate-90 money-icon" />
        {:else if footerState === "take"}
          <i class="fa-solid fa-right-from-bracket fa-rotate-270 money-icon" />
        {/if}
      </button>
    {/if}
  </div>
</main>

<style>
  main {
    align-items: center;
    align-self: flex-start;
    background-color: rgb(var(--primary-color));
    border-top: solid 2px rgb(var(--primary-border-color));
    bottom: 0;
    box-sizing: border-box;
    color: rgb(var(--text-on-primary-element-color));
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    justify-content: center;
    /* position: fixed; */
    padding: 0.5em;
    width: 100%;
  }

  .warning-text {
    font-weight: 600;
    text-align: center;
  }

  .footer-container {
    align-items: center;
    display: flex;
    height: 2em;
    gap: 1.5em;
    justify-content: center;
    width: 100%;
    max-width: 300px;
  }

  .spacer {
    flex-grow: 1;
  }

  .money-container {
    align-items: center;
    display: flex;
    flex-grow: 1;
    gap: 0.5em;
    justify-content: flex-start;
    overflow-x: auto;
    height: 100%;

    /* border: solid 1px black; */
  }

  .money-container-second {
    align-items: center;
    display: flex;
    gap: 0.5em;
    justify-content: center;
    flex-grow: 1;
    /* overflow-x: auto; */
    height: 100%;
  }

  .store-balance {
    /* font-size: 1.25em; */
    font-weight: 600;
  }

  .money-button,
  .operate-button {
    background-color: rgba(0, 0, 0, 0);
    border: none;
    color: white;
    cursor: pointer;
    /* display: none; */
    display: flex;
    margin: 0;
    padding: 0;
    /* width: 50px; */
  }

  .invalid-operate-button {
    opacity: 0.5;
  }

  .money-icon {
    font-size: 1.25em;
  }
  .cancel-button {
    font-weight: 800;
  }

  .input-container {
    align-items: center;
    display: flex;
    flex-grow: 1;
    gap: 0.25em;
    justify-content: center;
    height: 100%;
  }

  .input-container p {
    font-size: 1.25em;
    font-weight: 600;
  }

  .input-operator {
    /* background-color: rgb(var(--primary-color));
    color: rgb(var(--text-on-primary-element-color));
    outline: none;
    border: solid 1.5px rgb(var(--text-on-primary-element-color)); */
    color: rgb(var(--primary-color));
    flex-grow: 1;
    font-weight: 700;
    margin: 0;
    outline: none;
    width: 100%;
  }
</style>
