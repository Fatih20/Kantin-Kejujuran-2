<script lang="ts">
  import {
    maxDescriptionLength,
    maxNameLength,
    successTextDuration,
  } from "../config";

  import { appState, soldItemList } from "../stores";
  import type { ISoldItemLite, PossibleNameProblem } from "../utilities/types";
  import { validImageChecker } from "../utilities/utilities";

  let showingSuccessText = false;

  let imageInputKey = {};

  let name: string = "";
  let price: number | null | undefined = undefined;
  let description: string = "";
  let imageFilename: string | null = null;
  let image: FileList | null = null;

  let nameProblem = "empty" as PossibleNameProblem;
  let descriptionProblem = "empty" as PossibleNameProblem;

  let nameJustStarted = true;
  let priceJustStarted = true;
  let descriptionJustStarted = true;
  let imageJustStarted = true;

  let nameWarningText = "";
  let descriptionWarningText = "";
  let priceWarningText = "";
  let imageWarningText = "";

  let dataValid = false;

  $: dataValid = [nameValid, priceValid, descriptionValid, imageValid].every(
    (validity) => validity === true
  );

  $: {
    if (name !== "") {
      nameJustStarted = false;
    }
  }

  $: {
    if (description !== "") {
      descriptionJustStarted = false;
    }
  }

  $: {
    if (name === "") {
      nameProblem = "empty";
    } else if (name.length > maxNameLength) {
      nameProblem = "long";
    } else {
      nameProblem = "none";
    }
  }

  $: {
    if (description === "") {
      descriptionProblem = "empty";
    } else if (description.length > maxDescriptionLength) {
      descriptionProblem = "long";
    } else {
      descriptionProblem = "none";
    }
  }

  $: {
    if (nameProblem === "none") {
      nameWarningText = "";
    } else if (nameProblem === "empty") {
      nameWarningText = "Please enter a name";
    } else if (nameProblem === "long") {
      nameWarningText = "Name entered is too long";
    }
  }

  $: {
    if (descriptionProblem === "none") {
      descriptionWarningText = "";
    } else if (descriptionProblem === "empty") {
      descriptionWarningText = "Please enter a description";
    } else if (descriptionProblem === "long") {
      descriptionWarningText = "Description entered is too long";
    }
  }

  $: {
    if (!priceValid) {
      priceWarningText = "Please enter a positive number";
    } else {
      priceWarningText = "";
    }
  }

  $: {
    if (price !== undefined) {
      priceJustStarted = false;
    } else {
      priceJustStarted = true;
    }
  }

  $: {
    if (!imageValid) {
      imageWarningText = "Not an acceptable image";
    } else {
      image;
    }
  }

  $: {
    if (imageFilename !== null) {
      imageJustStarted = false;
    } else {
      imageJustStarted = true;
    }
  }

  $: {
    if (!validImageChecker(imageFilename)) {
      imageWarningText = "Invalid type of image";
    } else if (imageFilename === null) {
      imageWarningText = "Please upload an image";
    }
  }

  $: nameValid = nameProblem === "none";
  $: priceValid = price > 0 && price !== null;
  $: descriptionValid = descriptionProblem === "none";
  $: imageValid = validImageChecker(imageFilename) && image !== null;
  // let imageLink : string;

  function reset() {
    imageInputKey = {};
    name = "";
    price = undefined;
    description = "";
    imageFilename = null;
    image = null;

    nameJustStarted = true;
    priceJustStarted = true;
    descriptionJustStarted = true;
    imageJustStarted = true;
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Is submitting");
    const newSoldItem = {
      name,
      price,
      description,
      // image: image[0],
    } as ISoldItemLite;
    soldItemList.insert(newSoldItem);
    showingSuccessText = true;
    reset();
    setTimeout(() => {
      showingSuccessText = false;
    }, successTextDuration);
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

<main on:click={(e) => e.stopPropagation()}>
  <div class="form-container">
    <h2 class="title">What's the item?</h2>
    <form on:submit={handleSubmit}>
      <div class="input-element">
        <label for="image-input">Any photo of it? (JPG or PNG)</label>
        <div class="input-container">
          {#key imageInputKey}
            <input
              id="image-input"
              name="image-input"
              type="file"
              accept="image/png, image/jpeg"
              bind:value={imageFilename}
              bind:files={image}
            />
          {/key}
          <p
            class="input-warning"
            class:input-not-valid-warning={!imageValid && !imageJustStarted}
          >
            {imageWarningText}
          </p>
        </div>
      </div>
      <div class="input-element">
        <label for="name-input"
          >What's its name? ({`${name.length} / ${maxNameLength}`})</label
        >
        <div class="input-container">
          <input id="name-input" name="name-input" bind:value={name} />
          <p
            class="input-warning"
            class:input-not-valid-warning={!nameValid && !nameJustStarted}
          >
            {nameWarningText}
          </p>
        </div>
      </div>
      <div class="input-element">
        <label for="price-input">What is it worth? (Rp)</label>
        <div class="input-container">
          <input
            id="price-input"
            name="price-input"
            type="number"
            min="0"
            bind:value={price}
          />
          <p
            class="input-warning"
            class:input-not-valid-warning={!priceValid && !priceJustStarted}
          >
            {priceWarningText}
          </p>
        </div>
      </div>
      <div class="input-element">
        <label for="description-input"
          >Describe it ({`${description.length} / ${maxDescriptionLength}`})</label
        >
        <div class="input-container">
          <textarea
            id="description-input"
            name="description"
            type="text"
            min="0"
            bind:value={description}
            rows="5"
            cols="20"
          />
          <p
            class="input-warning"
            class:input-not-valid-warning={!descriptionValid &&
              !descriptionJustStarted}
          >
            {descriptionWarningText}
          </p>
        </div>
      </div>
      <div class="button-container">
        <button
          class="return-button"
          type="button"
          on:click={() => appState.set("trade")}
        >
          Back
        </button>
        <p class="success-text" class:success-text-shown={showingSuccessText}>
          Item succesfully added
        </p>
        <!-- <div class="spacer" /> -->
        <button
          class="submit-button"
          type="submit"
          class:submit-button-disabled={!dataValid}
          disabled={!dataValid}
        >
          Sell
        </button>
      </div>
    </form>
  </div>
</main>

<style>
  main {
    align-items: center;
    background-color: rgba(0, 0, 0, 0);
    box-sizing: border-box;
    /* border: solid 2px white; */
    color: rgb(var(--primary-color));
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: center;
    padding: 0.5em 1em;
    width: 100%;

    /* border: solid 1px black; */
  }

  .form-container {
    align-items: center;
    background-color: rgb(var(--primary-color));
    box-sizing: border-box;
    border-radius: var(--button-radius);
    color: rgb(var(--text-on-primary-element-color));
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    padding: 1em;
    /* width: 100%; */
  }

  .title {
    border-bottom: solid 2px rgb(var(--text-on-primary-element-color));
    display: inline-block;
    text-align: center;
    padding-bottom: 0.25em;
    width: 100%;
    /* border: solid 1px black; */
  }

  form {
    padding-top: 0.75em;
    align-items: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1em;
  }

  .input-element {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.175em;
    padding: 0;
    width: 100%;
  }
  label {
    font-weight: 400;
    margin: 0;
  }

  .input-container {
    align-content: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.5em;
    width: 100%;
  }

  input,
  textarea {
    border-radius: var(--button-radius);
    outline-color: rgb(var(--primary-color));
  }

  input {
    margin: 0;
    width: 100%;
  }
  .input-warning {
    display: none;
    background-color: rgb(var(--warning-color-bg));
    box-sizing: border-box;
    border-radius: var(--button-radius);
    color: rgb(var(--warning-color-fg));
    font-weight: 500;
    padding: 3px 6px;
  }
  .input-not-valid-warning {
    display: inline-block;
  }

  textarea {
    resize: vertical;
    margin: 0;
    max-width: 100%;
    width: 100%;
  }
  .button-container {
    align-items: center;
    display: flex;
    gap: 0.5em;
    justify-content: center;
    width: 100%;
  }

  button {
    background-color: rgba(var(--primary-color), 0);
    border-radius: var(--button-smaller-radius);
    border: none;
    color: rgb(var(--text-on-primary-element-color));
    font-weight: 600;
    transition: all 0.25s ease-in-out;
    /* font-size: 1em; */
    margin: 0;
    /* width: 75px; */
    padding: 7px;
  }

  .spacer {
    flex-grow: 1;
  }

  button:hover {
    background-color: rgb(var(--text-on-primary-element-color));
    color: rgb(var(--primary-color));
  }

  .submit-button-disabled {
    --border-color: var(--disabled-color);
    /* background-color: rgb(var(--disabled-color)); */
    color: rgba(var(--text-on-disabled-element-color), 0.5);
    cursor: initial;
  }

  .submit-button-disabled:hover {
    background-color: rgba(var(--primary-color), 0);
    color: rgba(var(--text-on-disabled-element-color), 0.5);
  }

  .success-text {
    background-color: rgb(var(--success-color-bg));
    border-radius: var(--button-radius);
    color: rgb(var(--success-color-fg));
    display: inline-block;
    font-weight: 500;
    flex-grow: 1;
    opacity: 0;
    padding: 3px 6px;
    transition: opacity 0.25s ease-in-out;
    text-align: center;
  }

  .success-text-shown {
    opacity: 1;
  }
</style>
