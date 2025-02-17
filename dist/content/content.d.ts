/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Chunk, RefChunk, DataChunk, ChunkMetadata, Mimetype } from '../interfaces.js';
/** Role enum definition. */
export declare enum ROLE {
    USER = "USER",
    ASSISTANT = "ASSISTANT",
    SYSTEM = "SYSTEM",
    CONTEXT = "CONTEXT"
}
/** Role of the chunk as a type. */
export declare type Role = `${ROLE}`;
/**
 * Type assertion the chunk is a text.
 */
export declare function isTextChunk(maybeChunk: unknown): maybeChunk is TextChunk;
/**
 * Type assertion the chunk is a json.
 */
export declare function isJsonChunk(maybeChunk: unknown): maybeChunk is TextChunk;
/**
 * Type assertion the chunk is a blob.
 */
export declare function isRefChunk(maybeChunk: unknown): maybeChunk is RefChunk;
/**
 * Type assertion the chunk is data.
 */
export declare function isDataChunk(maybeChunk: unknown): maybeChunk is DataChunk;
/**
 * Type assertion the chunk is a chunk.
 */
export declare function isChunk(maybeChunk: unknown): maybeChunk is Chunk;
/**
 * Creates a json chunk.
 */
export declare function jsonChunk(json: any, metadata?: ChunkMetadata, replacer?: (this: any, key: string, value: any) => any): Chunk;
/**
 * Converts a chunk to json.
 */
export declare function chunkJson(chunk: Chunk, reviver?: (this: any, key: string, value: any) => any): unknown;
/**
 * Creates a plain text chunk.
 */
export declare function textChunk(text: string, metadata?: ChunkMetadata): PlainTextChunk;
/**
 * Converts a chunk to text.
 */
export declare function chunkText(chunk: Chunk, throwOnError?: boolean): string;
/**
 * Converts a chunk to a blob.
 */
export declare function chunkBlob(chunk: Chunk): Blob;
/**
 * Converts a image to a chunk.
 */
export declare function imageChunk(image: HTMLImageElement, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Converts a audio to a chunk.
 */
export declare function audioChunk(audio: HTMLAudioElement, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Converts a video to a chunk.
 */
export declare function videoChunk(video: HTMLVideoElement, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Converts a fetch resource to a chunk.
 */
export declare function fetchChunk(resp: Promise<Response> | Response, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Converts a blob to a chunk.
 */
export declare function blobChunk(blob: Blob, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Returns a chunk with the given metadata.
 */
export declare function withMetadata<T extends Chunk>(chunk: T, metadata: ChunkMetadata): T;
/**
 * Returns true if the mimetype matches the given proto message type.
 */
export declare function isProtoMessage(mimeType: Mimetype, messageType: string): boolean;
export declare const JSON_MIME_TYPE: {
    readonly type: "application";
    readonly subtype: "json";
};
export declare const TEXT_MIME_TYPE: {
    readonly type: "text";
    readonly subtype: "plain";
};
/**
 * Type of a plain text chunk.
 */
export declare type PlainTextChunk = Chunk & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'text';
            readonly subtype: 'plain';
        };
    };
};
/**
 * Type of a text chunk.
 */
export declare type TextChunk = Chunk & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'text';
        };
    };
};
/**
 * Type of a audio chunk.
 */
export declare type AudioChunk = Chunk & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'audio';
        };
    };
};
