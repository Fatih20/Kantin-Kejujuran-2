import { writable } from "svelte/store";
import { initialSortCondition, initialStoreBalance } from "./config";
import type { ISoldItem, ISoldItemLite, PossibleAppState, SortingCondition } from "./utilities/types";
import { compareFunctionGenerator, fetchItemFromLocalStorage, objToString } from "./utilities/utilities";

function createStoreBalance () {
    const {subscribe, set, update} = writable(initializeStoreBalance());

    function initializeStoreBalance() {
    const newInitialStoreBalance = (fetchItemFromLocalStorage("storeBalance") ?? initialStoreBalance) as number;
    localStorage.setItem("storeBalance", JSON.stringify(newInitialStoreBalance))
    return newInitialStoreBalance;
    }

    function add (increment) {
        update (previousBalance => {
            const newValue = previousBalance + increment
            localStorage.setItem("storeBalance", JSON.stringify(newValue));
            return newValue
        })
    }

    function subtract (increment) {
        update (previousBalance => {
            const newValue = previousBalance - increment
            localStorage.setItem("storeBalance", JSON.stringify(newValue));
            return newValue
        })
    }

    
    async function reset () {
        localStorage.removeItem("storeBalance");
        set(initialStoreBalance);
    }

    function removeFromLocalStorage() {
        localStorage.removeItem("storeBalance");
    }

    return {
        subscribe,
        reset,
        set,
        update,
        add,
        subtract,
        removeFromLocalStorage,
    }
}

function createSoldItemList () {
    const {subscribe, set, update} = writable(initializeSoldItemList());

    function initializeSoldItemList() {
        const newInitialSoldItemList = (fetchItemFromLocalStorage("soldItemList") ?? []) as ISoldItem[];
        localStorage.setItem("soldItemList", JSON.stringify(newInitialSoldItemList))
        return newInitialSoldItemList;
        }

    function insert (newSoldItem : ISoldItemLite) {
        update (previousSoldItemList => {
            const date = new Date()
            const dateCreated = `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`
            const timeAppendedNewSoldItem = {...newSoldItem, dateCreated, milisecondCreated : date.getTime()} as ISoldItem;
            const newSoldItemList = [...previousSoldItemList, timeAppendedNewSoldItem]
            localStorage.setItem("soldItemList", JSON.stringify(newSoldItemList));
            return newSoldItemList;
        })
    }

    function remove (removedSoldItem : ISoldItem) {
        update (previousSoldItemList => {
            console.log("Is trying to remove")
            const newSoldItemList = previousSoldItemList.filter((soldItem) => JSON.stringify(soldItem) !== JSON.stringify(removedSoldItem)
            );
            localStorage.setItem("soldItemList", JSON.stringify(newSoldItemList));
            return newSoldItemList;
        })
    }

    function resort (sortCondition : SortingCondition) {
        update(previousSoldItemList => {
            console.log(previousSoldItemList);
            previousSoldItemList.sort(compareFunctionGenerator(sortCondition[0], sortCondition[1]));
            console.log(previousSoldItemList);
            localStorage.setItem("soldItemList", JSON.stringify(previousSoldItemList));
            return previousSoldItemList;
        })
    }

    
    async function reset () {
        localStorage.removeItem("soldItemList");
        set([] as ISoldItem[]);
    }

    function removeFromLocalStorage() {
        localStorage.removeItem("soldItemList");
    }

    return {
        subscribe,
        reset,
        set,
        update,
        insert,
        remove,
        resort,
        removeFromLocalStorage,
    }
}

function createSortCondition () {
    const {subscribe, set, update } = writable(initializeSortCondition());

    function initializeSortCondition() {
        const newSortCondition = (fetchItemFromLocalStorage("sortCondition") ?? initialSortCondition) as SortingCondition;
        localStorage.setItem("sortCondition", JSON.stringify(newSortCondition));
        return newSortCondition;
    }

    function alternateSortBy () {
        update(previousSortCondition => {
            previousSortCondition[0] = !previousSortCondition[0];
            localStorage.setItem("sortCondition", JSON.stringify(previousSortCondition));
            return previousSortCondition
        })
    }

    function alternateSortOrder () {
        update(previousSortCondition => {
            previousSortCondition[1] = !previousSortCondition[1];
            localStorage.setItem("sortCondition", JSON.stringify(previousSortCondition));
            return previousSortCondition
        })

    }

    return {
        subscribe,
        set,
        update,
        alternateSortBy,
        alternateSortOrder
    }


}

export const appState = writable("add" as PossibleAppState)
export const soldItemList = createSoldItemList();
export const storeBalance = createStoreBalance();
export const sortCondition = createSortCondition();