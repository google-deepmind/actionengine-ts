/**
 * @fileoverview Library for working with lazy tree like stream of chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    audioChunk,
    blobChunk,
    fetchChunk,
    imageChunk,
    isChunk,
    textChunk,
    videoChunk,
    withMetadata,
  } from '../content/index.js';
  import {Chunk, ChunkMetadata, Content, ROLE} from '../interfaces.js';
  import {isAsyncIterable, createStream} from '../stream/index.js';
  
  /** Transform a series of unknown values to chunks with the exception of str. */
  function transformToContent(
    value: unknown,
    metadataFn?: (chunk: Chunk) => ChunkMetadata,
  ): Content {
    if (typeof window !== 'undefined') {
      if (value instanceof HTMLImageElement) {
        value = imageChunk(value);
      } else if (value instanceof HTMLAudioElement) {
        value = audioChunk(value);
      } else if (value instanceof HTMLVideoElement) {
        value = videoChunk(value);
      }
    }
    if (typeof value === 'string') {
      value = textChunk(value);
    }
    if (value instanceof Blob) {
      value = blobChunk(value);
    }
    if (value instanceof Response) {
      value = fetchChunk(value);
    }
    if (isChunk(value)) {
      if (metadataFn) {
        value = withMetadata(value, metadataFn(value));
      }
    }
    if (value instanceof Promise) {
      const pl = createStream<Chunk>();
      value
        .then((v) => {
          if (isChunk(v)) {
            if (metadataFn) {
              v = withMetadata(v, metadataFn(v));
            }
          } else {
            v = transformToContent(v, metadataFn);
          }
          pl.write(v);
          pl.close();
        })
        .catch((err: string) => {
          pl.error(err);
        });
      value = pl;
    }
    if (!assertIsContent(value)) {
      throw new Error('Unsupported value type');
    }
    return value;
  }
  
  /**
   * Factory for a template literal for constructing a prompt with specific
   * metadata.
   */
  export function promptLiteralWithMetadata(
    metadataFn?: (chunk: Chunk) => ChunkMetadata,
  ) {
    function prompt(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): Content {
      const node: Content[] = [];
      const l = values.length;
      let str = '';
      for (let i = 0; i < l; i++) {
        str += strings[i];
        let value = values[i];
        // Empty values are treated as empty strings.
        if (value === undefined || value === null) {
          value = '';
        }
        if (typeof value === 'string') {
          str += value;
        } else {
          if (str) {
            let chunk = textChunk(str);
            if (metadataFn) {
              chunk = withMetadata(chunk, metadataFn(chunk));
            }
            node.push(chunk);
          }
          str = '';
          node.push(transformToContent(value, metadataFn));
        }
      }
      str += strings[l];
      if (str) {
        let chunk = textChunk(str);
        if (metadataFn) {
          chunk = withMetadata(chunk, metadataFn(chunk));
        }
        node.push(chunk);
      }
  
      if (node.length === 1) {
        return node[0];
      }
      return node;
    }
    return prompt;
  }
  
  function assertIsContent(value: unknown): value is Content {
    if (Array.isArray(value)) {
      return value.every((v) => assertIsContent(v));
    }
    if (isChunk(value) || isAsyncIterable(value)) {
      return true;
    }
    return false;
  }
  
  /**
   * Template literal for constructing a prompt.
   */
  export const prompt = promptLiteralWithMetadata();
  
  /**
   * Template literal for constructing a prompt but always with user role.
   */
  export const userPrompt = promptLiteralWithMetadata(() => ({role: ROLE.USER}));
  /**
   * Template literal for constructing a prompt but always with system role.
   */
  export const systemPrompt = promptLiteralWithMetadata(() => ({
    role: ROLE.SYSTEM,
  }));
  /**
   * Template literal for constructing a prompt but always with assistant role.
   */
  export const assistantPrompt = promptLiteralWithMetadata(() => ({
    role: ROLE.ASSISTANT,
  }));
  /**
   * Template literal for constructing a prompt but always with context role.
   */
  export const contextPrompt = promptLiteralWithMetadata(() => ({
    role: ROLE.CONTEXT,
  }));
  
  /**
   * Transforms a Content to a new Content with the given metadata.
   */
  export function promptWithMetadata(
    prompt: Content,
    metadata: ChunkMetadata,
  ): Content {
    if (isChunk(prompt)) {
      const chunk = withMetadata(prompt, metadata);
      return chunk;
    } else if (prompt instanceof Array) {
      const list: Content = prompt.map((child) =>
        promptWithMetadata(child, metadata),
      );
      return list;
    } else if (isAsyncIterable(prompt)) {
      const pipe = createStream<Chunk>();
      const source = prompt;
      const transform = async () => {
        try {
          for await (const item of source) {
            pipe.write(promptWithMetadata(item, metadata));
          }
        } catch (err: unknown) {
          pipe.error(`${err}`);
        } finally {
          pipe.close();
        }
      };
      void transform();
      return pipe;
    }
    throw new Error(`Unsupported type ${prompt}`);
  }
  