/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Chunk, RefChunk, DataChunk, ChunkMetadata, Mimetype} from '../interfaces.js';

/** Role enum definition. */
export enum ROLE {
    USER = 'USER',
    ASSISTANT = 'ASSISTANT',
    SYSTEM = 'SYSTEM',
    CONTEXT = 'CONTEXT',
}
/** Role of the chunk as a type. */
export declare type Role = `${ROLE}`;

/**
 * Type assertion the chunk is a text.
 */
export function isTextChunk(maybeChunk: unknown): maybeChunk is TextChunk {
  return (maybeChunk as Chunk).metadata?.mimetype?.type === 'text';
}

/**
 * Type assertion the chunk is a json.
 */
export function isJsonChunk(maybeChunk: unknown): maybeChunk is TextChunk {
  const chunk = maybeChunk as Chunk;
  const mimetype = chunk.metadata?.mimetype;
  return mimetype?.type === 'application' && mimetype?.subtype === 'json';
}

/**
 * Type assertion the chunk is a blob.
 */
export function isRefChunk(maybeChunk: unknown): maybeChunk is RefChunk {
  return (maybeChunk as Chunk).ref !== undefined;
}

/**
 * Type assertion the chunk is data.
 */
export function isDataChunk(maybeChunk: unknown): maybeChunk is DataChunk {
  return (maybeChunk as Chunk).data !== undefined;
}

/**
 * Type assertion the chunk is a chunk.
 */
export function isChunk(maybeChunk: unknown): maybeChunk is Chunk {
  const c = maybeChunk as Chunk;
  const hasPayload = c.ref !== undefined || c.data !== undefined;
  const hasMetadata = c.metadata !== undefined;
  return hasPayload || hasMetadata;
}

/**
 * Creates a json chunk.
 */
export function jsonChunk(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: any,
  metadata: ChunkMetadata = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replacer?: (this: any, key: string, value: any) => any,
): Chunk {
  const defaultMetadata: ChunkMetadata = {
    captureTime: new Date(),
  };
  return {
    metadata: {
      ...defaultMetadata,
      ...metadata,
      mimetype: {
        ...metadata?.mimetype,
        type: 'application',
        subtype: 'json',
      },
    },
    data: new TextEncoder().encode(JSON.stringify(json, replacer)),
  };
}

/**
 * Converts a chunk to json.
 */
export function chunkJson(
  chunk: Chunk,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviver?: (this: any, key: string, value: any) => any,
): unknown {
  if (isJsonChunk(chunk)) {
    if (isDataChunk(chunk)) {
      const text = new TextDecoder().decode(chunk.data);
      return JSON.parse(text, reviver);
    }
    if (chunk.ref) {
      // TODO(doug): Implement ref chunk.
      throw new Error('Ref chunk not yet implemented');
    }
    return null;
  }
  throw new Error('Not a json mimetype for the chunk.');
}

/**
 * Creates a plain text chunk.
 */
export function textChunk(
  text: string,
  metadata: ChunkMetadata = {},
): PlainTextChunk {
  const defaultMetadata: ChunkMetadata = {
    captureTime: new Date(),
  };
  return {
    metadata: {
      ...defaultMetadata,
      ...metadata,
      mimetype: {
        ...metadata?.mimetype,
        type: 'text',
        subtype: 'plain',
      },
    },
    data: new TextEncoder().encode(text),
  };
}

/**
 * Converts a chunk to text.
 */
export function chunkText(chunk: Chunk, throwOnError = false): string {
  if (isTextChunk(chunk)) {
    if (isDataChunk(chunk)) {
      const text = new TextDecoder().decode(chunk.data);
      return text;
    }
    if (chunk.ref) {
      // TODO(doug): Implement ref chunk.
      throw new Error('Ref chunk not yet implemented');
    }
    return '';
  }
  if (throwOnError) {
    throw new Error(`Unsupported chunk type: ${chunk}`);
  }
  // Unknown chunk type stringify as best as possible.
  return JSON.stringify(chunk);
}

/**
 * Converts a chunk to a blob.
 */
export function chunkBlob(chunk: Chunk): Blob {
  let parts: BlobPart[];
  if (isDataChunk(chunk)) {
    parts = [chunk.data!];
  } else {
    // TODO(doug): Implement ref chunk.
    throw new Error('Ref chunk not yet implemented');
  }
  const blob = new Blob(parts, {
    type: stringifyMimetype(chunk.metadata?.mimetype),
  });
  return blob;
}

/**
 * Converts a image to a chunk.
 */
export async function imageChunk(
  image: HTMLImageElement,
  metadata: ChunkMetadata = {},
): Promise<Chunk> {
  // Wait for image to load if not already loaded.
  if (!image.complete) {
    await new Promise<void>((resolve) => {
      image.addEventListener(
        'load',
        () => {
          resolve();
        },
        {once: true},
      );
    });
  }
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2d context');
  }
  ctx.drawImage(image, 0, 0, image.width, image.height);
  const blob = await canvas.convertToBlob();
  return await blobChunk(blob, metadata);
}

interface HTMLMediaElementWithCapture extends HTMLMediaElement {
  captureStream?(): MediaStream | null;
}

// TODO(doug): Use media recorder for capturing content from media.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function captureMediaFromElement(
  mediaElement: HTMLMediaElementWithCapture,
  maxDurationMs = 0,
): Promise<Blob> {
  const stream = mediaElement.captureStream
    ? mediaElement.captureStream()
    : null;
  if (!stream) {
    throw new Error('Unable to capture media stream from element.');
  }

  const mediaRecorder = new MediaRecorder(stream);
  const chunks: Blob[] = [];

  let type = 'audio/ogg; codecs=opus';

  mediaRecorder.ondataavailable = (event) => {
    chunks.push(event.data);
    type = event.data.type;
  };

  const blob = new Promise<Blob>((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, {type});
      resolve(blob);
    };
  });

  mediaRecorder.start();

  if (maxDurationMs) {
    setTimeout(() => {
      mediaRecorder.stop();
    }, maxDurationMs);
  }

  return blob;
}

/**
 * Converts a audio to a chunk.
 */
export async function audioChunk(
  audio: HTMLAudioElement,
  metadata: ChunkMetadata = {},
): Promise<Chunk> {
  // TODO: Implement via media recorder as an option.
  // const blob = await captureMediaFromElement(audio, maxDurationMs);
  // return blobChunk(blob, metadata);
  return fetchChunk(fetch(audio.src), metadata);
}

/**
 * Converts a video to a chunk.
 */
export async function videoChunk(
  video: HTMLVideoElement,
  metadata: ChunkMetadata = {},
): Promise<Chunk> {
  // TODO(doug): Implement via media recorder as an option.
  return fetchChunk(fetch(video.src), metadata);
}

/**
 * Converts a fetch resource to a chunk.
 */
export async function fetchChunk(
  resp: Promise<Response> | Response,
  metadata: ChunkMetadata = {},
): Promise<Chunk> {
  resp = await Promise.resolve(resp);
  return blobChunk(await resp.blob(), metadata);
}

/**
 * Converts a blob to a chunk.
 */
export async function blobChunk(
  blob: Blob,
  metadata: ChunkMetadata = {},
): Promise<Chunk> {
  const defaultMetadata: ChunkMetadata = {
    captureTime: new Date(),
  };
  const mimetype = parseMimetype(blob.type);
  return {
    metadata: {
      ...defaultMetadata,
      ...metadata,
      mimetype,
    },
    data: new Uint8Array(await blob.arrayBuffer()),
  };
}

/**
 * Returns a chunk with the given metadata.
 */
export function withMetadata<T extends Chunk>(
  chunk: T,
  metadata: ChunkMetadata,
): T {
  return {
    ...chunk,
    metadata: {
      ...chunk.metadata,
      ...metadata,
    },
  };
}

/**
 * Converts a mimetype to a string.
 */
export function stringifyMimetype(mimetype?: Mimetype): string {
  if (!mimetype) {
    return 'application/octet-stream';
  }
  let result = '';
  if (!mimetype.type) {
    return result;
  }
  result += mimetype.type;
  if (!mimetype.subtype) {
    return result;
  }
  result += '/';
  if (mimetype.prefix) {
    result += `${mimetype.prefix}.`;
  }
  result += mimetype.subtype;
  if (mimetype.suffix) {
    result += `+${mimetype.suffix}`;
  }
  if (mimetype.parameters) {
    for (const [key, value] of Object.entries(mimetype.parameters)) {
      result += `; ${key}=${value}`;
    }
  }
  return result;
}

/**
 * Parses a mimetype from a string.
 */
export function parseMimetype(mimetype?: string): Mimetype {
  if (!mimetype) {
    return {type: 'application', subtype: 'octet-stream'};
  }
  let parameters: {[key: string]: string} | undefined = undefined;
  const paramParts = mimetype.split(';');
  if (paramParts.length > 1) {
    mimetype = mimetype.substring(0, paramParts[0].length);
    parameters = {};
    for (let i = 1; i < paramParts.length; i++) {
      const [key, value] = paramParts[i].trim().split('=');
      parameters[key] = value;
    }
  }
  const parts = mimetype.split('/');
  if (parts.length !== 2) {
    throw new Error(`Invalid mimetype: ${mimetype}`);
  }
  const [type, rest] = parts;
  let subtype: string | undefined = undefined;
  let prefix: string | undefined = undefined;
  let suffix: string | undefined = undefined;
  const vndSplit = rest.lastIndexOf('.');
  if (vndSplit >= 0) {
    prefix = rest.slice(0, vndSplit);
    subtype = rest.slice(vndSplit + 1);
  } else {
    subtype = rest;
  }
  const suffixSplit = subtype.indexOf('+');
  if (suffixSplit >= 0) {
    suffix = subtype.slice(suffixSplit + 1);
    subtype = subtype.slice(0, suffixSplit);
  }
  return {
    type,
    subtype,
    prefix,
    suffix,
    parameters,
  };
}

/**
 * Returns true if the mimetype matches the given proto message type.
 */
export function isProtoMessage(mimeType: Mimetype, messageType: string) {
  return (
    mimeType.type === 'application' &&
    mimeType.subtype === 'x-protobuf' &&
    mimeType.parameters?.['type'] === messageType
  );
}

export const JSON_MIME_TYPE = {
  type: 'application',
  subtype: 'json',
} as const satisfies Mimetype;

export const TEXT_MIME_TYPE = {
  type: 'text',
  subtype: 'plain',
} as const satisfies Mimetype;

/**
 * Type of a plain text chunk.
 */
export declare type PlainTextChunk = Chunk & {
  readonly metadata: {
    readonly mimetype: {readonly type: 'text'; readonly subtype: 'plain'};
  };
};

/**
 * Type of a text chunk.
 */
export declare type TextChunk = Chunk & {
  readonly metadata: {readonly mimetype: {readonly type: 'text'}};
};
