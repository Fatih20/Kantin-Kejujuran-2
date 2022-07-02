<button>
  <slot />
</button>

<style>
  button {
    background-color: rgb(var(--primary-color));
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
</style>
