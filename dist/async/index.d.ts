/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Races a list of streams returning the first value to resolve from any stream.
 */
export declare function merge<T extends ReadonlyArray<AsyncIterator<unknown> | AsyncIterable<unknown>>>(...arr: [...T]): T[number];
