/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import { Chunk, Content } from '../interfaces.js';
import { createStream } from '../stream/stream.js';
import { ignoreFields } from '../testing/matchers.js';

import { audioChunk, fetchChunk, imageChunk, textChunk, videoChunk, } from './content.js';
import { prompt, promptWithMetadata } from './prompt.js';

const isBrowser = typeof window !== 'undefined';

async function asArray(content: Content): Promise<Chunk[]> {
  const s = createStream<Chunk>();
  await s.writeAndClose(content);
  return await s;
}

describe('prompt', () => {
  beforeEach(() => {
    jasmine.addCustomEqualityTester(ignoreFields('captureTime'));
  });

  it('converts with consolidated text chunks', () => {
    const result = prompt`hello ${'there'}`;
    const expected = textChunk('hello there');
    expect<unknown>(result).toEqual(expected);
  });

  it('converts to a node graph', () => {
    const chunk = textChunk('hello', { role: 'SYSTEM' });
    const result = prompt`hello ${chunk}`;
    expect<unknown>(result).toEqual([
      textChunk('hello '),
      textChunk('hello', { role: 'SYSTEM' }),
    ]);
  });

  it('converts nested prompts to a node graph', () => {
    const chunk = textChunk('foo', { role: 'SYSTEM' });
    const nested = prompt`bar${prompt`moo${chunk}`}`;
    const result = prompt`baz${chunk}${nested}`;
    expect<unknown>(result).toEqual([
      textChunk('baz'),
      textChunk('foo', { role: 'SYSTEM' }),
      [
        textChunk('bar'),
        [textChunk('moo'), textChunk('foo', { role: 'SYSTEM' })],
      ],
    ]);
  });

  it('converts async prompts to a node graph', async () => {
    const p = createStream<Chunk>();
    const result = prompt`${p}`;

    const substream = createStream<Chunk>();

    await p.write(substream);
    await p.write(textChunk('foo'));
    await p.write(textChunk('bar'));
    await p.close();

    await substream.write(textChunk('baz'));
    await substream.write(textChunk('bat'));
    await substream.close();

    const resultTree = await asArray(result);
    expect<unknown>(resultTree).toEqual([
      textChunk('baz'),
      textChunk('bat'),
      textChunk('foo'),
      textChunk('bar'),
    ]);
  });

  it('converts async strings to a node graph', async () => {
    const result = prompt`hello ${Promise.resolve('world')}`;
    expect<unknown>(await asArray(result)).toEqual([textChunk('hello '), textChunk('world')]);
  });

  if (isBrowser) {
    it('handles image input', async () => {
      const img = new Image();
      img.src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z7DwCwAGPAKWS7xnTwAAAABJRU5ErkJggg==';
      const result = prompt`describe this image: ${img}`;

      const resultTree = await asArray(result);
      const iChunk = await imageChunk(img);

      expect<unknown>(resultTree).toEqual([
        textChunk('describe this image: '), iChunk
      ]);
    });

    it('handles audio input', async () => {
      const audio = new Audio();
      audio.src =
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

      const result = prompt`describe this audio: ${audio}`;

      const resultTree = await asArray(result);
      const aChunk = await audioChunk(audio);

      expect<unknown>(resultTree).toEqual([
        textChunk('describe this audio: '), aChunk
      ]);
    });

    it('handles video input', async () => {
      const video = document.createElement('video');
      video.src =
        'data:video/webm;base64,GkXfo0AgQoaBAUL3gQFC8oEEQvOBCEKCQAR3ZWJtQoeBAkKFgQIYU4BnQI0VSalmQCgq17FAAw9CQE2AQAZ3aGFtbXlXQUAGd2hhbW15RIlACECPQAAAAAAAFlSua0AxrkAu14EBY8WBAZyBACK1nEADdW5khkAFVl9WUDglhohAA1ZQOIOBAeBABrCBCLqBCB9DtnVAIueBAKNAHIEAAIAwAQCdASoIAAgAAUAmJaQAA3AA/vz0AAA=';

      const result = prompt`describe this video: ${video}`;

      const resultTree = await asArray(result);
      const vChunk = await videoChunk(video);

      expect<unknown>(resultTree).toEqual([
        textChunk('describe this video: '), vChunk
      ]);
    });
  }

  it('handles fetch input', async () => {
    const fetchResponse = () => fetch(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z7DwCwAGPAKWS7xnTwAAAABJRU5ErkJggg==',
    );
    const result = prompt`describe this content: ${fetchResponse()}`;

    const resultList = await asArray(result);
    const fChunk = await fetchChunk(fetchResponse());

    expect<unknown>(resultList).toEqual([
      textChunk('describe this content: '), fChunk
    ]);
  });
});

describe('promptWithMetadata', () => {
  beforeEach(() => {
    jasmine.addCustomEqualityTester(ignoreFields('captureTime'));
  });

  it('converts a prompt adding metadata', () => {
    let p = prompt`hello how are you?`;

    expect<unknown>(p).toEqual(textChunk('hello how are you?'));

    p = promptWithMetadata(p, { role: 'USER' });

    expect<unknown>(p).toEqual(textChunk('hello how are you?', { role: 'USER' }));
  });

  it('converts a prompt adding metadata for arrays', () => {
    const sub = prompt`submessage`;
    let p = prompt`hello how are you? ${sub}`;

    expect<unknown>(p).toEqual([
      textChunk('hello how are you? '),
      textChunk('submessage'),
    ]);

    p = promptWithMetadata(p, { role: 'USER' });

    expect<unknown>(p).toEqual([
      textChunk('hello how are you? ', { role: 'USER' }),
      textChunk('submessage', { role: 'USER' }),
    ]);
  });
});
