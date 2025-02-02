/**
 * @fileoverview Library for working with lazy tree like stream of chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Stream as StreamInterface, StreamItems} from './interfaces.js';

// Polyfill for Promise.withResolvers
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = <T>() => {
    let resolve;
    let reject;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return {promise, resolve, reject} as unknown as PromiseWithResolvers<T>;
  };
}

/**
 * A writable AsyncIterable.
 */
class Stream<T> implements StreamInterface<T> {
  private closed = false;
  private readonly children: StreamItems<T>[] = [];
  private readonly iterators: Array<StreamIterator<T>> = [];
  private errorValue: string|undefined;

  /**
   * Writes a value to the stream.
   */
  write(value: StreamItems<T>): void {
    if (this.closed) {
      throw new Error('Stream is closed');
    }
    this.children.push(value);
    for (const iterator of [...this.iterators]) {
      iterator.write(value);
    }
  }

  /**
   * Closes the stream.
   */
  close(): void {
    this.closed = true;
    for (const iterator of [...this.iterators]) {
      iterator.close();
    }
  }

  get isClosed() {
    return this.closed;
  }

  get size() {
    return this.children.length;
  }

  get items() {
    return [...this.children];
  }

  getError() {
    return this.errorValue;
  }

  /*
   * Errors the stream if there has been a problem.
   */
  error(reason?: string) {
    this.errorValue = reason;
    this.closed = true;
    for (const iterator of [...this.iterators]) {
      iterator.error(reason);
    }
  }

  /**
   * Async iterator over the raw StreamItems being pushed in.
   */
  rawAsyncIterator(): AsyncIterator<StreamItems<T>> {
    const iterator = new StreamIterator(this, this.children, () => {
      const index = this.iterators.indexOf(iterator);
      if (index >= 0) {
        this.iterators.splice(index, 1);
      }
    });
    this.iterators.push(iterator);
    return iterator;
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    const stream = iteratorToIterable(this.rawAsyncIterator());
    const items = leaves(stream)[Symbol.asyncIterator]();
    return items;
  }

  then = thenableAsyncIterable;
}

async function*
    iteratorToIterable<T>(iter: AsyncIterator<T>): AsyncIterable<T> {
  while (true) {
    const result = await iter.next();
    if (result.done) break;
    yield result.value;
  }
}

class StreamIterator<T> implements AsyncIterator<StreamItems<T>> {
  private readonly writeQueue: StreamItems<T>[] = [];
  private readonly readQueue:
      Array<PromiseWithResolvers<IteratorResult<StreamItems<T>>>> = [];

  constructor(
      private readonly stream: Stream<T>,
      current: StreamItems<T>[],
      private readonly done: () => void,
  ) {
    this.writeQueue = [...current];
  }

  write(value: StreamItems<T>): void {
    const queued = this.readQueue.shift();
    if (queued) {
      queued.resolve({done: false, value});
    } else {
      this.writeQueue.push(value);
    }
  }

  close() {
    const queued = this.readQueue.shift();
    if (queued) {
      queued.resolve({done: true, value: undefined});
    }
  }

  error(error?: string) {
    const queued = this.readQueue.shift();
    if (queued) {
      queued.reject(error);
    }
  }

  next(): Promise<IteratorResult<StreamItems<T>>> {
    const value = this.writeQueue.shift();
    if (value) {
      return Promise.resolve({done: false, value});
    }
    if (this.stream.getError() !== undefined) {
      return Promise.reject(this.stream.getError());
    }
    const done = this.writeQueue.length === 0 && this.stream.isClosed;
    if (done) {
      this.done();
      return Promise.resolve({done, value: undefined});
    }
    const next = Promise.withResolvers<IteratorResult<StreamItems<T>>>();
    this.readQueue.push(next);
    return next.promise;
  }

  return(value?: T): Promise<IteratorResult<StreamItems<T>>> {
    this.done();
    return Promise.resolve({done: true, value});
  }
}

/** Constructor function for creating a stream object. */
export function createStream<T>(): StreamInterface<T> {
  return new Stream<T>();
}


/**
 * Returns true if the provided object implements the AsyncIterator protocol via
 * implementing a `Symbol.asyncIterator` method.
 */
export function isAsyncIterable<T = unknown>(
    maybeAsyncIterable: AsyncIterable<T>|unknown,
    ): maybeAsyncIterable is AsyncIterable<T> {
  const iter = maybeAsyncIterable as AsyncIterable<T>;
  return typeof iter[Symbol.asyncIterator] === 'function';
}


/**
 * Leaves of a Stream because the stream can be recursive this flattens it in
 * order.
 */
async function* leaves<T>(items: StreamItems<T>): AsyncIterable<T> {
  if (items instanceof Array) {
    for (const node of items) {
      yield* leaves(node);
    }
  } else if (isAsyncIterable<StreamItems<T>>(items)) {
    for await (const node of items) {
      yield* leaves(node);
    }
  } else {
    yield items;
  }
}

/** A function to aggregate an AsyncIterable to a PromiseLike thenable. */
export function thenableAsyncIterable<T, TResult1 = T[], TResult2 = never>(
    this: AsyncIterable<T>,
    onfulfilled?:|((value: T[]) => TResult1 | PromiseLike<TResult1>)|undefined|
    null,
    onrejected?:|((reason: unknown) => TResult2 | PromiseLike<TResult2>)|
    undefined|null,
    ): Promise<TResult1|TResult2> {
  const aggregate = async () => {
    const items = [];
    for await (const item of this) {
      items.push(item);
    }
    return items;
  };
  return aggregate().then(onfulfilled, onrejected);
}

/** Make an asyncIterable PromiseLike. */
export function awaitableAsyncIterable<T>(iter: AsyncIterable<T>):
    AsyncIterable<T>&PromiseLike<T[]> {
  const then = iter as AsyncIterable<T>& PromiseLike<T[]>;
  then.then = thenableAsyncIterable;
  return then;
}
