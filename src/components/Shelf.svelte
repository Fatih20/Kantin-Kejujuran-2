<script lang="ts">
  import { soldItemList, appState, sortCondition } from "../stores";
  import type {
    ISoldItem,
    ShelfState,
    SortingCondition,
  } from "../utilities/types";
  import { priceDenominator } from "../utilities/utilities";
  import SoldItem from "./SoldItem.svelte";

  let shelfState = "all" as ShelfState;
  let seenItem: ISoldItem;

  $: seenName = seenItem?.name;
  $: seenPrice = seenItem?.price;
  $: seenDescription = seenItem?.description;
  $: seenDate = seenItem?.dateCreated;

  function overallSortingTextGenerator(sortCondition: SortingCondition) {
    if (sortCondition[0]) {
      return sortCondition[1] ? "From oldest" : "From newest";
    } else {
      return sortCondition[1]
        ? "Alphabetical order"
        : "Reverse alphabetical order";
    }
  }
  $: firstSortingText = $sortCondition[0] ? "Date" : "Name";
  $: secondSortingText = $sortCondition[1] ? "Ascending" : "Descending";
  $: overallSortingText = overallSortingTextGenerator($sortCondition);

  function seeItem(e: CustomEvent) {
    shelfState = "one";
    const { detail } = e;
    const { soldItem }: { soldItem: ISoldItem } = detail as {
      soldItem: ISoldItem;
    };

    seenItem = soldItem;
  }

  function handleBuySeenItem() {
    soldItemList.remove(seenItem);
    handleCloseSeeItem();
  }

  function handleCloseSeeItem() {
    shelfState = "all";
    seenItem = {} as ISoldItem;
  }

  function handleSortChanges(isOrder: boolean) {
    if (isOrder) {
      sortCondition.alternateSortOrder();
    } else {
      sortCondition.alternateSortBy();
    }
    soldItemList.resort($sortCondition);
  }
  // $: soldItemList.resort($sortCondition);
</script>

<main>
  {#if shelfState === "one"}
    <div class="absolute-container" on:click={handleCloseSeeItem}>
      <!-- <div class="spacer" /> -->
      <div class="seen-item-container" on:click={(e) => e.stopPropagation()}>
        <div class="seen-image-container">
          <img class="seen-image" src="placeholder3.png" alt="Product chosen" />
        </div>
        <div class="main-seen-item-container">
          <div class="title-part-container">
            <h3 class="seen-name">{seenName}</h3>
            <p class="seen-date">{seenDate}</p>
          </div>
          <h2 class="seen-price">{priceDenominator(seenPrice)}</h2>
          <p class="seen-description">{seenDescription}</p>
        </div>
        <button class="buy-in-see-button" on:click={handleBuySeenItem}
          >Buy Item</button
        >
      </div>
      <!-- <button
        class="add-new-button"
        on:click={(e) => {
          appState.set("add");
          e.stopPropagation();
        }}>Add new Item</button
      > -->
    </div>
  {/if}
  {#if $soldItemList.length === 0}
    <div class="spacer" />
    <h2 class="empty-text">No items are currently sold</h2>
    <div class="spacer" />
  {:else}
    <div class="sort-container">
      <p class="sort-text">Sort Method: <span>{overallSortingText}</span></p>
      <div class="spacer" />
      <div class="sort-button-container">
        <button class="sort-button" on:click={() => handleSortChanges(true)}
          >{secondSortingText}</button
        >
        <button class="sort-button" on:click={() => handleSortChanges(false)}
          >{firstSortingText}</button
        >
      </div>
    </div>
    <div class="shelf">
      {#each $soldItemList as soldItem (soldItem.milisecondCreated)}
        <SoldItem on:seeItem={seeItem} {soldItem} />
      {/each}
    </div>
  {/if}
</main>

<style>
  main {
    --padding-of-shelf-main: 0.75em;
    align-items: center;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    flex-grow: 1;
    gap: 0.75em;
    overflow-y: auto;
    position: relative;
    padding: var(--padding-of-shelf-main);
    width: min(100%, 1000px);

    /* border: solid 1px black; */
  }

  .absolute-container {
    align-items: center;
    box-sizing: border-box;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    justify-content: center;
    left: 0;
    /* opacity: 0; */
    right: 0;
    position: fixed;
    padding: var(--padding-of-shelf-main);
    top: 0;
    /* height: 100%; */
    transition: all 0.25s ease-in-out;
    /* visibility: hidden; */
    z-index: 1000;

    /* border: solid 1px white; */
  }
  .seen-item-container {
    align-items: flex-start;
    background-color: rgb(var(--secondary-color));
    border-radius: var(--button-radius);
    box-sizing: border-box;
    color: rgb(var(--text-on-secondary-element-color));
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    justify-content: center;
    padding: 0.5em;
    width: min(300px, 100%);
  }

  .seen-image-container {
    align-items: center;
    background-color: rgb(0, 0, 0);
    border-radius: var(--button-radius);
    display: flex;
    justify-content: center;
    overflow: hidden;
    min-height: 0;
    min-width: 0;
    max-height: 250px;
    width: 100%;
  }

  .seen-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .main-seen-item-container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }

  .seen-date {
    font-size: 0.8em;
  }

  .seen-price {
    font-size: 1.25em;
  }

  .seen-name,
  .seen-price {
    font-weight: 600;
  }

  .empty-text {
    color: rgba(var(--primary-color), 0.75);
    text-align: center;
  }

  .spacer {
    flex-grow: 1;
  }

  .add-new-button {
    align-self: center;
    background-color: rgb(var(--primary-color));
    border-radius: var(--button-smaller-radius);
    color: rgb(var(--text-on-primary-element-color));
    cursor: pointer;
    font-weight: 600;
    transition: all 0.25s ease-in-out;
    /* font-size: 1em; */
    margin: 0;
    pointer-events: all;
    padding: 7px;
    /* width: 75px; */
  }

  .buy-in-see-button {
    background-color: rgb(var(--text-on-primary-element-color));
    border-radius: var(--button-smaller-radius);
    box-sizing: border-box;
    border: none;
    color: rgb(var(--primary-color));
    font-weight: 600;
    transition: all 0.25s ease-in-out;
    margin: 0;
    padding: 7px;
  }

  .shelf {
    --gap-size: 0.75em;
    --minimum-item-width: 200px;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: repeat(
      auto-fill,
      minmax(var(--minimum-item-width), 1fr)
    );
    /* grid-template-rows: repeat(auto-fit, 150px); */
    gap: var(--gap-size);
    /* flex-grow: 1; */
    /* padding: 0.5em; */
    width: 100%;
  }

  .sort-container {
    align-items: center;
    display: flex;
    /* flex-direction: column; */
    gap: 0.5em;
    justify-content: center;
    width: 100%;
  }

  .sort-text,
  .sort-button {
    font-weight: 500;
  }

  .sort-text {
    /* line-height: 2; */
    user-select: none;
    /* text-align: center; */
  }

  .sort-text span {
    font-weight: 400;
  }

  .sort-button-container {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25em;
    text-align: left;
    justify-content: flex-end;

    /* border: solid 1px white; */
  }

  .sort-button {
    background-color: rgb(var(--text-on-primary-element-color));
    /* box-sizing: border-box; */
    color: rgb(var(--primary-color));
    border-radius: var(--button-radius);
    cursor: pointer;
    margin: 0;
    padding: 0.2em;
  }
</style>
