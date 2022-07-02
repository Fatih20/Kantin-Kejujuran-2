import { validImageExtensionList } from "../config";

const possibleAppStateList = ["startPage", "trade", "add"] as const;

export type PossibleAppState = typeof possibleAppStateList[number];

const possibleFooterStateList = ["default", "take", "give"] as const;

export type PossibleFooterState = typeof possibleFooterStateList[number];

const possibleInputProblemList = ["none", "overdraw", "NaN", "negative"] as const;
export type PossibleInputProblem = typeof possibleInputProblemList[number];

export interface ISoldItemLite {
    name : string,
    imageLink : File,
    description : string,
    price : number,

}

export interface ISoldItem extends ISoldItemLite {
    milisecondCreated : number,
    dateCreated : string,
}

export interface ISoldItemRaw extends ISoldItem {
    id : number
}

const possibleNameProblemList = ["none", "long", "empty"] as const;
export type PossibleNameProblem = typeof possibleNameProblemList[number];

// const possibleSortBy = ["date", "price"] as const;
// const possibleSortOrder = ["ascending", "descending"] as const;

// type SortBy = typeof possibleSortBy[number];
// type SortOrder = typeof possibleSortOrder[number];

export type SortingCondition = [boolean, boolean];
// The first is whether to sort by date or name, date = true. The second is whether to sort in ascending order

const possibleShelfState = ["all", "one"] as const;
export type ShelfState = typeof possibleShelfState[number];