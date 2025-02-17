/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Stream Interfaces Start

export type StreamItems<T> = T | AsyncIterable<StreamItems<T>> | StreamItems<T>[]

export interface WritableStream<T> {
    write(value: StreamItems<T>): Promise<void>;
    writeAndClose(value: StreamItems<T>): Promise<void>;
    close(): Promise<void>;
    error(reason?: string): void;
}
export type ReadableStream<T> = AsyncIterable<T> & PromiseLike<T[]>;

/** Placeholder to write or read a tree or chunk fragments to later. */
export interface Stream<T> extends ReadableStream<T>, WritableStream<T> {
    readonly isClosed: boolean;
    readonly size: number;
    readonly items: StreamItems<T>[];
    rawAsyncIterator(): AsyncIterator<StreamItems<T>>;
}

// Stream Interfaces End
