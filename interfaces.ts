/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type StreamItems, type ReadableStream, type WritableStream } from "./stream/interfaces";

// Chunk Interfaces Start

/** google.protobuf.Any proto mapping. */
export declare interface Any {
    readonly '@type': string;
    readonly [key: string]: undefined | null | string | number | boolean | object;
}

/** Metadata for a chunk. */
export declare interface ChunkMetadata {
    readonly mimetype?: Mimetype;
    readonly role?: string;
    readonly captureTime?: Date;
    readonly experimental?: Any[];
}

/** Structured mimetype */
export interface Mimetype {
    // Example: 'application/vnd.google.gdm.content+json'
    readonly type?: string; // 'application'
    readonly subtype?: string; // 'content'
    readonly prefix?: string; // 'vnd.google.gdm' the prefix such as vnd
    readonly suffix?: string; // 'json', from +json suffix
    readonly parameters?: {
        readonly [key: string]: string;
    }; // after the ';' like '; type=aiae.v1.MyConfig' or
    // '; charset=utf-8'
}

/** Chunk with metadata. */
export interface MetadataChunk {
    readonly metadata: ChunkMetadata;
}

/** Chunk with bytes. */
export interface DataChunk extends MetadataChunk {
    readonly data: Uint8Array;
    readonly ref?: undefined;
}

/** Chunk with a reference to content elsewhere. */
export interface RefChunk extends MetadataChunk {
    readonly data?: undefined;
    readonly ref: string;
}

/** Smallest unit of streamable information. */
export type Chunk = DataChunk | RefChunk;

// Chunk Interfaces End

// ChunkStream Interfaces Start

export type Content = StreamItems<Chunk>;
export type Input = ReadableStream<Chunk>;
export type Output = WritableStream<Chunk>
export interface Pipe extends Input, Output {
}

// ChunkStream Interfaces End

// Action Interfaces Start

export type Dict<T,U extends string = string> = Readonly<Record<U,T>>;
type StreamTypeOfDict<T extends Dict<unknown>> = T extends Dict<infer U> ? U extends WritableStream<infer V> ? V : never : never;

export abstract class Action<T extends Dict<Input> = Dict<Input>, U extends Dict<Output> = Dict<Output>> {
    abstract run(session: Session, inputs: T, outputs: U): Promise<void>;
}

export type ActionInputs<T extends Action> = T extends Action<infer U> ? U : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ActionOutputs<T extends Action> = T extends Action<infer U, infer V> ? Dict<ReadableStream<StreamTypeOfDict<V>>, keyof V & string> : never;
export type ActionConstraints<T extends Action> = keyof ActionOutputs<T> & string;
// Action Interfaces End

// Processor Interfaces Start

/** Simplified transform of a unified Chunk stream. */
export interface Processor<T extends [string, Chunk] = [string, Chunk], U extends [string, Chunk] = [string, Chunk]> {
    (stream: AsyncIterable<T>): AsyncGenerator<U>
}

/** Processor Chunks. */
export type ProcessorChunks<T extends string = string, U extends Chunk = Chunk> = AsyncIterable<[T, U]>;
/** Input dict to a processor. */
export type ProcessorInputs<T extends Processor> = T extends Processor<infer U> ? Readonly<Record<U[0], AsyncIterable<U[1]>>> : never;
/** Output dict to a processor. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ProcessorOutputs<T extends Processor> = T extends Processor<infer U, infer V> ? Readonly<Record<V[0], ReadableStream<V[1]>>> : never;
export type ProcessorConstraints<T extends Processor> = keyof ProcessorOutputs<T> & string;
// Processor Interfaces End

// Session Interfaces Start

export interface Session {
    // Returns a streaming pipe for reading and writing a stream in the context of the session.
    // Content will exist and can be read for as long as the session is open.
    createPipe(): Pipe;
    // Runs an action.
    run<T extends Action, U extends ActionConstraints<T> = ActionConstraints<T>>(action: T, inputs: ActionInputs<T>, outputs: U[]): Pick<ActionOutputs<T>,U>;
    // Runs a processor which is a convenience form transformed to an Action.
    run<T extends Processor, U extends ProcessorConstraints<T> = ProcessorConstraints<T>>(processor: T, inputs: ProcessorInputs<T>, outputs: U[]): Pick<ProcessorOutputs<T>,U>;
    // Closes the session and all open streams or running actions.
    close(): Promise<void>;
}

export interface SessionWriteOptions {
   // Sequence in the stream of the chunk defaults to 0.
   seq?: number, 
   // Is the stream still being written to defaults to false.
   continued?: boolean,
}

export interface SessionContext {
    read(id: string): AsyncIterable<Chunk>;
    write(id: string, chunk: Chunk, options?: SessionWriteOptions): Promise<void>;
    error(id: string, reason?: string): void;
    close(): Promise<void>;
}

export interface SessionContextMiddleware {
    (context: SessionContext): SessionContext;
}

export interface SessionProvider {
    (...middleware: SessionContextMiddleware[]): Session;
}

// Session Interfaces End
