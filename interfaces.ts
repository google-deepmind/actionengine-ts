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

/** Role enum definition. */
export enum ROLE {
    USER = 'USER',
    ASSISTANT = 'ASSISTANT',
    SYSTEM = 'SYSTEM',
    CONTEXT = 'CONTEXT',
}
/** Role of the chunk as a type. */
export declare type Role = `${ROLE}`;

/** Metadata for a chunk. */
export declare interface ChunkMetadata {
    readonly mimetype?: Mimetype;
    readonly role?: Role;
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

/** Internal Chunk representation should not be used directly unless implementing SessionContext. */
export type InternalChunk = Chunk & {
    seq: number;
    continued: boolean;
}


// Chunk Interfaces End

// ChunkStream Interfaces Start

export type Content = StreamItems<Chunk>
export type Output = WritableStream<Chunk>;
export type Input = ReadableStream<Chunk>;
export interface Placeholder extends Input, Output {
}

// ChunkStream Interfaces End

// Action Interfaces Start

export type Transferable = Readonly<number> | Readonly<string> | Readonly<{ [key: string | number]: Transferable }> | Readonly<ArrayLike<Transferable>>;

// export interface Action<T extends {[key: string]: Input} = {[key: string]: Input}, U extends {[key: string]: Output} = {[key: string]: Output}, V extends Readonly<{[key: string]: Transferable}> = Readonly<{[key: string]: Transferable}>> {
//     run(session: Session, inputs: T, outputs: U, configs?: V): Promise<void>;
// }

// export abstract class AbstractAction<T extends {[key: string]: Input} = {[key: string]: Input}, U extends {[key: string]: Output} = {[key: string]: Output}, V extends Readonly<{[key: string]: Transferable}> = Readonly<{[key: string]: Transferable}>> implements Action<T,U,V> {
export abstract class Action<T extends { [key: string]: Input } = { [key: string]: Input }, U extends { [key: string]: Output } = { [key: string]: Output }, V extends Readonly<{ [key: string]: Transferable }> = Readonly<{ [key: string]: Transferable }>> {
    abstract run(session: Session, inputs: T, outputs: U, configs?: V): Promise<void>;
}

export type ActionInputs<T extends Action> = T extends Action<infer U> ? U : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ActionOutputs<T extends Action> = T extends Action<infer U, infer V> ? V : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ActionConfigs<T extends Action> = T extends Action<infer U, infer V, infer W> ? W : never;

// Action Interfaces End

// Session Interfaces Start

export interface Session {
    // Returns a placeholder for reading and writing a stream in the context of the session
    placeholder(): Placeholder;
    // Runs an action.
    run<T extends Action>(action: abstract new () => T, inputs: ActionInputs<T>, outputs: ActionOutputs<T>, configs?: ActionConfigs<T>): Promise<void>;
    // Closes the session and all open streams or running actions.
    close(): Promise<void>;
    // Provide an implementation of an action.
    provide<T extends Action>(sym: abstract new () => T, impl: new () => T): void;
}

export interface SessionContext {
    read(id: string): AsyncIterable<Chunk>;
    write(id: string, chunk: InternalChunk): Promise<void>;
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

// General Interfaces Start

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;

// General Interfaces End