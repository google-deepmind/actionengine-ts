/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Returns the first promise to resolve and which index it came from.
 */
function raceWithIndex<T>(promises: Array<Promise<T>>): Promise<[T, number]> {
    const {promise, resolve, reject} = Promise.withResolvers<[T, number]>();
    const l = promises.length;
    let complete = false;
    for (let i = 0; i < l; i++) {
      const p = promises[i];
      p.then((v) => {
        if (complete) {
          return;
        }
        complete = true;
        resolve([v, i]);
      }).catch((e) => {
        if (complete) {
          return;
        }
        complete = true;
        reject(e);
      });
    }
    return promise;
  }
  
  /**
   * Races a list of streams returning the first value to resolve from any stream.
   */
  export async function* merge<
    T extends ReadonlyArray<AsyncIterator<unknown>|AsyncIterable<unknown>>>(...arr: [...T]): T[number] {
    const sources = [...arr].map((p) => {
      const iter = p as AsyncIterable<unknown>;
      if (typeof iter[Symbol.asyncIterator] === "function") {
        return iter[Symbol.asyncIterator]();
      }
      return p as AsyncIterator<unknown>;
    });
    const queue = sources.map((p) => p.next());
    while (queue.length > 0) {
      const [result, i] = await raceWithIndex(queue);
      if (result.done) {
        queue.splice(i, 1);
        sources.splice(i, 1);
      } else {
        queue[i] = sources[i].next();
        yield result.value;
      }
    }
  }
  