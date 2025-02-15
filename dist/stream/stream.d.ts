/**
 * @fileoverview Library for working with lazy tree like stream of chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Stream as StreamInterface } from './interfaces.js';
/** Constructor function for creating a stream object. */
export declare function createStream<T>(): StreamInterface<T>;
/**
 * Returns true if the provided object implements the AsyncIterator protocol via
 * implementing a `Symbol.asyncIterator` method.
 */
export declare function isAsyncIterable<T = unknown>(maybeAsyncIterable: AsyncIterable<T> | unknown): maybeAsyncIterable is AsyncIterable<T>;
/** A function to aggregate an AsyncIterable to a PromiseLike thenable. */
export declare function thenableAsyncIterable<T, TResult1 = T[], TResult2 = never>(this: AsyncIterable<T>, onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | undefined | null): Promise<TResult1 | TResult2>;
/** Make an asyncIterable PromiseLike. */
export declare function awaitableAsyncIterable<T>(iter: AsyncIterable<T>): AsyncIterable<T> & PromiseLike<T[]>;
