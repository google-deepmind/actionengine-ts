/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import {chunkText, textChunk} from '../content/index.js';
import {Chunk} from '../interfaces.js';
import {createStream} from './stream.js';

describe('createStream<Chunk>', () => {
  it('can be written to with chunks', async () => {
    const p = createStream<Chunk>();

    p.write(textChunk('hello '));
    p.write(textChunk('there'));
    p.close();

    let text = '';
    for await (const chunk of p) {
      expect(chunk).not.toBeInstanceOf(Array);
      text += chunkText(chunk as Chunk);
    }
    expect(text).toBe('hello there');
  });

  it('can be written to with nested tree', async () => {
    const p = createStream<Chunk>();

    p.write([textChunk('hello ')]);
    p.write([textChunk('there')]);
    p.close();

    let text = '';
    for await (const arr of p) {
      expect(arr).toBeInstanceOf(Array);
      for (const chunk of arr as unknown as Chunk[]) {
        text += chunkText(chunk);
      }
    }
    expect(text).toBe('hello there');
  });

  it('will correctly propagate errors', async () => {
    const p = createStream<Chunk>();

    p.write(textChunk('hello'));
    const error = 'fail';
    p.error(error);

    let text = '';
    try {
      for await (const chunk of p) {
        text += chunkText(chunk as Chunk);
      }
    } catch (e) {
      expect(e).toBe(error);
    }
    expect(text).toBe('hello');
  });

  it('can be iterated over multiple times', async () => {
    const p = createStream<Chunk>();

    p.write(textChunk('hello'));
    const a = (async () => {
      let text = '';
      for await (const chunk of p) {
        text += chunkText(chunk as Chunk);
      }
      return text;
    })();

    const b = (async () => {
      let text = '';
      for await (const chunk of p) {
        text += chunkText(chunk as Chunk);
      }
      return text;
    })();

    p.write(textChunk(' there'));
    p.close();
    expect(await Promise.all([a, b])).toEqual(['hello there', 'hello there']);
  });

  it('cleans up iterators when completed', async () => {
    const p = createStream<Chunk>();

    p.write(textChunk('hello'));
    await (async () => {
      // tslint:disable-next-line:no-unused-variable
      for await (const chunk of p) {
        break;
      }
    })();
    const pApi = p as unknown as StreamApi;
    // The early exit should trigger a removal of the iterator.
    expect(pApi.iterators.length).toBe(0);
    p.write(textChunk(' there'));
    p.close();
    const result = await (async () => {
      let text = '';
      for await (const chunk of p) {
        text += chunkText(chunk as Chunk);
      }
      return text;
    })();
    // Close of the createStream<Chunk> should trigger a removal of the iterator.
    expect(pApi.iterators.length).toBe(0);
    expect(result).toBe('hello there');
  });
});

/** Access non-public fields of the stream for testing. */
interface StreamApi {
  // tslint:disable-next-line:no-any
  readonly iterators: any[];
}
