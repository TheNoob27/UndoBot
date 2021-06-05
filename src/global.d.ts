import { PermissionResolvable } from "discord.js"
import UndoBot from "./client/Client"

type commonErrors = "Unknown Message"
  | "Missing Access"
  | "Missing Permissions"
  | "Unknown Channel"
  | "Unknown User"
  | "Unknown Member"
  | "Unknown" // shortcut for all

declare module "discord.js" {
  type _PermissionString = PermissionString | "READ_MESSAGES"
  type _PermissionResolvable = BitFieldResolvable<_PermissionString>

  export interface Message {
    readonly client: UndoBot
  }

  interface Channel {
    hasPermission(permission: _PermissionResolvable, user?: UserResolvable): boolean
  }
}

declare global {
  /**
   * Async setTimeout. You can invert the parameters to run like setTimeout
   * @param {number} [ms=1000] The amount of time to wait.
   * @param {Function} [fn=null] The function to call after waiting.
   * @param {...*} a Args to pass into the function
   */
  function waitTimeout(ms: number): Promise<void>
  function waitTimeout<A, V>(ms: number, fn: (...args: A[]) => V, ...a: A[]): Promise<V>
  function waitTimeout<A, V>(fn: (...args: A[]) => V, ms: number, ...a: A[]): Promise<V>

  interface Number {
    // B)
    [Symbol.iterator](): IterableIterator<number>
  }

  interface Array<T> {
    /**
     * Get a random element from this array.
     */
    random(): T
    random(n: 1): T
    /**
     * Get 2 random elements from this array.
     */
    random(n: 2): [T, T]
    /**
     * Get random elements from this array.
     */
    random(n: number): T[]

    /**
     * Get the first element from this array.
     */
    first(): this[0]
    /**
     * Get the first elements from this array.
     */
    first(n: number): T[]

    /**
     * Get the last elements from this array.
     */
    last(): T
    /**
     * Get the last element from this array.
     */
    last(n: number): T[]

    /**
     * Clone this array.
     */
    clone(): T[]

    /**
     * Remove values from the array, and returns a new copy.
     * @param v Values to remove from the array. If none is specified, all `undefined`s are removed.
     */
    trim(...v: T[]): T[]

    /**
     * Remove values from the array, mutating the array.
     * @param v Values to remove from the array. If none is specified, all `undefined`s are removed.
     */
    remove(...v: T[]): this

    /**
     * Map an array with async functions and resolve all the promises.
     * @param {Function} fn Function to run on all elements in the array.
     * @param {*} [thisArg] Value to use as `this` when executing function
     */
    asyncMap<V>(fn: (v: T, i: number, array: this) => Promise<V>): Promise<V[]>
    asyncMap<This, V>(fn: (this: This, v: T, i: number, array: this) => Promise<V>, thisArg: This): Promise<V[]>
  }

  interface String {
    /**
     * Strip indents from the start of each line in a string.
     * @param tabSize Optional tab size to remove from the start of each line.
     */
    stripIndents(tabSize?: number): string

    /**
     * Conver the string into Proper Case.
     * @param all Whether or not to change all words to proper case, or just the start of the string.
     */
    toProperCase(all: boolean): string

    /**
     * Get words from a string.
     * @param pattern A regex pattern to parse words from.
     */
    words(pattern: RegExp): string[]

    /**
     * Pads the current string with a given string (possibly repeated)
     * so that the resulting string reaches a given length.
     * The padding is applied on both sides of the current string.
     * @param maxLength The length of the resulting string once the current string has been padded.
     * @param fillString The string to pad the current string with. Defaults to `" "`
     */
    pad(maxLength: number, fillString?: string): string
  }

  interface Promise<T> {
    /**
     * Sets a defualt value, returned when this promise rejects, or returns nothing.
     * @param v The default value
     */
    default(): this
    default(v: null): this
    default<V>(v: V): this | V
    /**
     * Silences the rejection of a promise, and optionally returns a default value instead.
     * @param v The default value
     */
    silence(): this
    silence(v: null): this
    silence<V>(v: V): this | V
    /**
     * Returns a value, regardless of whether or not the promise rejects.
     * @param v The value to return
     */
    return(): void
    return(v: null): void
    return<V>(v: V): V

    /**
     * Catch specific errors and throw the rest.
     * @param filter The filter to use to find errors to catch.
     * @param handler The handler used to handle these errors.
     */
    catchErrors<V>(filter: string | string[] | RegExp, handler: (e: Error) => V): this | V
    catchErrors<V>(filter: commonErrors | commonErrors[] | RegExp, handler: (e: Error) => V): this | V

    /**
     * Catch and silence specific errors and throw the rest.
     * @param filter The filter to use to find errors to catch.
     * @param value The value to return if an error is caught
     */
    silenceErrors(filter: string | string[] | RegExp): this
    silenceErrors(filter: string | string[] | RegExp, value: null): this
    silenceErrors<V>(filter: string | string[] | RegExp, value: V): this | V
    silenceErrors(filter: commonErrors | commonErrors[] | RegExp): this
    silenceErrors(filter: commonErrors | commonErrors[] | RegExp, value: null): this
    silenceErrors<V>(filter: commonErrors | commonErrors[] | RegExp, value: V): this | V
  }

  interface Date {
    /**
     * Format a date.
     * If a string is passed, it replaces
     * DD with the day number,
     * MM with the month or number (Jun or ../6/..),
     * YY with the year,
     * WD with the day of the week (Mon),
     * HH with the hour,
     * mm with the minute,
     * SS with the seconds
     * @param options
     */
    format(options: string | {
      style: "ios" | "normal" | "clock",
      date: boolean,
      seconds: boolean,
      hour12: boolean
    })
  }
}

export {}
