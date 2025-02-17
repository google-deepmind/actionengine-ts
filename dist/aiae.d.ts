/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
type StreamItems<T> = T | AsyncIterable<StreamItems<T>> | StreamItems<T>[];
interface WritableStream<T> {
    write(value: StreamItems<T>): void;
    writeAndClose(value: StreamItems<T>): void;
    close(): void;
    error(reason?: string): void;
}
type ReadableStream<T> = AsyncIterable<T> & PromiseLike<T[]>;

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** google.protobuf.Any proto mapping. */
declare interface Any {
    readonly '@type': string;
    readonly [key: string]: undefined | null | string | number | boolean | object;
}
/** Metadata for a chunk. */
declare interface ChunkMetadata {
    readonly mimetype?: Mimetype;
    readonly role?: string;
    readonly captureTime?: Date;
    readonly experimental?: Any[];
}
/** Structured mimetype */
interface Mimetype {
    readonly type?: string;
    readonly subtype?: string;
    readonly prefix?: string;
    readonly suffix?: string;
    readonly parameters?: {
        readonly [key: string]: string;
    };
}
/** Chunk with metadata. */
interface MetadataChunk {
    readonly metadata: ChunkMetadata;
}
/** Chunk with bytes. */
interface DataChunk extends MetadataChunk {
    readonly data: Uint8Array;
    readonly ref?: undefined;
}
/** Chunk with a reference to content elsewhere. */
interface RefChunk extends MetadataChunk {
    readonly data?: undefined;
    readonly ref: string;
}
/** Smallest unit of streamable information. */
type Chunk = DataChunk | RefChunk;
type Content<T extends Chunk = Chunk> = StreamItems<T>;
type Input<T extends Chunk = Chunk> = ReadableStream<T>;
type Output<T extends Chunk = Chunk> = WritableStream<T>;
interface Pipe<T extends Chunk = Chunk> extends Input<T>, Output<T> {
}
type Dict<T, U extends string = string> = Readonly<Record<U, T>>;
type StreamTypeOfDict<T extends Dict<unknown>> = T extends Dict<infer U> ? U extends WritableStream<infer V> ? V : never : never;
declare abstract class Action<T extends Dict<Input> = Dict<Input>, U extends Dict<Output> = Dict<Output>> {
    abstract run(session: Session, inputs: T, outputs: U): Promise<void>;
}
type ActionInputs<T extends Action> = T extends Action<infer U> ? U : never;
type ActionOutputs<T extends Action> = T extends Action<infer U, infer V> ? Dict<ReadableStream<StreamTypeOfDict<V>>, keyof V & string> : never;
type ActionConstraints<T extends Action> = keyof ActionOutputs<T> & string;
/** Simplified transform of a unified Chunk stream. */
interface Processor<I extends string = string, O extends string = string, T extends Chunk = Chunk, U extends Chunk = Chunk> {
    (stream: AsyncIterable<[I, T]>): AsyncGenerator<[O, U]>;
}
/** Processor Chunks. */
type ProcessorChunks<T extends string = string, U extends Chunk = Chunk> = AsyncIterable<[T, U]>;
/** Input dict to a processor. */
type ProcessorInputs<T extends Processor> = T extends Processor<infer I, string, infer X, Chunk> ? {
    [P in I]: AsyncIterable<X>;
} : never;
/** Output dict to a processor. */
type ProcessorOutputs<T extends Processor> = T extends Processor<string, infer O, Chunk, infer Y> ? {
    [P in O]: ReadableStream<Y>;
} : never;
type ProcessorConstraints<T extends Processor> = keyof ProcessorOutputs<T> & string;
interface Session {
    createPipe<T extends Chunk>(): Pipe<T>;
    run<T extends Action, U extends ActionConstraints<T> = ActionConstraints<T>>(action: T, inputs: ActionInputs<T>, outputs: U[]): Pick<ActionOutputs<T>, U>;
    run<T extends Processor<any, any>, U extends ProcessorConstraints<T> = ProcessorConstraints<T>>(processor: T, inputs: ProcessorInputs<T>, outputs: U[]): Pick<ProcessorOutputs<T>, U>;
    close(): Promise<void>;
}
interface SessionWriteOptions {
    seq?: number;
    continued?: boolean;
}
interface SessionContext {
    read(id: string): AsyncIterable<Chunk>;
    write(id: string, chunk: Chunk, options?: SessionWriteOptions): Promise<void>;
    error(id: string, reason?: string): void;
    close(): Promise<void>;
}
interface SessionContextMiddleware {
    (context: SessionContext): SessionContext;
}
interface SessionProvider {
    (...middleware: SessionContextMiddleware[]): Session;
}

/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Role enum definition. */
declare enum ROLE {
    USER = "USER",
    ASSISTANT = "ASSISTANT",
    SYSTEM = "SYSTEM",
    CONTEXT = "CONTEXT"
}
/** Role of the chunk as a type. */
declare type Role = `${ROLE}`;
/**
 * Type assertion the chunk is a text.
 */
declare function isTextChunk(maybeChunk: unknown): maybeChunk is TextChunk;
/**
 * Type assertion the chunk is a json.
 */
declare function isJsonChunk(maybeChunk: unknown): maybeChunk is TextChunk;
/**
 * Type assertion the chunk is a blob.
 */
declare function isRefChunk(maybeChunk: unknown): maybeChunk is RefChunk;
/**
 * Type assertion the chunk is data.
 */
declare function isDataChunk(maybeChunk: unknown): maybeChunk is DataChunk;
/**
 * Type assertion the chunk is a chunk.
 */
declare function isChunk(maybeChunk: unknown): maybeChunk is Chunk;
/**
 * Creates a json chunk.
 */
declare function jsonChunk(json: any, metadata?: ChunkMetadata, replacer?: (this: any, key: string, value: any) => any): Chunk;
/**
 * Converts a chunk to json.
 */
declare function chunkJson(chunk: Chunk, reviver?: (this: any, key: string, value: any) => any): unknown;
/**
 * Creates a plain text chunk.
 */
declare function textChunk(text: string, metadata?: ChunkMetadata): PlainTextChunk;
/**
 * Converts a chunk to text.
 */
declare function chunkText(chunk: Chunk, throwOnError?: boolean): string;
/**
 * Converts a chunk to a blob.
 */
declare function chunkBlob(chunk: Chunk): Blob;
/**
 * Converts a image to a chunk.
 */
declare function imageChunk(image: HTMLImageElement, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Converts a audio to a chunk.
 */
declare function audioChunk(audio: HTMLAudioElement, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Converts a video to a chunk.
 */
declare function videoChunk(video: HTMLVideoElement, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Converts a fetch resource to a chunk.
 */
declare function fetchChunk(resp: Promise<Response> | Response, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Converts a blob to a chunk.
 */
declare function blobChunk(blob: Blob, metadata?: ChunkMetadata): Promise<Chunk>;
/**
 * Returns a chunk with the given metadata.
 */
declare function withMetadata<T extends Chunk>(chunk: T, metadata: ChunkMetadata): T;
/**
 * Returns true if the mimetype matches the given proto message type.
 */
declare function isProtoMessage(mimeType: Mimetype, messageType: string): boolean;
declare const JSON_MIME_TYPE: {
    readonly type: "application";
    readonly subtype: "json";
};
declare const TEXT_MIME_TYPE: {
    readonly type: "text";
    readonly subtype: "plain";
};
/**
 * Type of a plain text chunk.
 */
declare type PlainTextChunk = Chunk & {
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
declare type TextChunk = Chunk & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'text';
        };
    };
};
/**
 * Type of a audio chunk.
 */
declare type AudioChunk = Chunk & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'audio';
        };
    };
};

/**
 * @fileoverview Library for working with lazy tree like stream of chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Factory for a template literal for constructing a prompt with specific
 * metadata.
 */
declare function promptLiteralWithMetadata(metadataFn?: (chunk: Chunk) => ChunkMetadata): (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt.
 */
declare const prompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt but always with user role.
 */
declare const userPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt but always with system role.
 */
declare const systemPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt but always with assistant role.
 */
declare const assistantPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt but always with context role.
 */
declare const contextPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Transforms a Content to a new Content with the given metadata.
 */
declare function promptWithMetadata(prompt: Content, metadata: ChunkMetadata): Content;

/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Converts Audio Chunks to a Media Stream. */
declare function audioChunksToMediaStream(chunks: AsyncIterable<Chunk>): MediaStreamAudioDestinationNode;
/** Converts a Media Stream to audio chunks. */
declare function mediaStreamToAudioChunks(media: MediaStream): AsyncGenerator<AudioChunk>;

/**
 * Converts a mimetype to a string.
 */
declare function stringifyMimetype(mimetype?: Mimetype): string;
/**
 * Parses a mimetype from a string.
 */
declare function parseMimetype(mimetype?: string): Mimetype;

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type index_d$7_AudioChunk = AudioChunk;
declare const index_d$7_JSON_MIME_TYPE: typeof JSON_MIME_TYPE;
type index_d$7_PlainTextChunk = PlainTextChunk;
type index_d$7_ROLE = ROLE;
declare const index_d$7_ROLE: typeof ROLE;
type index_d$7_Role = Role;
declare const index_d$7_TEXT_MIME_TYPE: typeof TEXT_MIME_TYPE;
type index_d$7_TextChunk = TextChunk;
declare const index_d$7_assistantPrompt: typeof assistantPrompt;
declare const index_d$7_audioChunk: typeof audioChunk;
declare const index_d$7_audioChunksToMediaStream: typeof audioChunksToMediaStream;
declare const index_d$7_blobChunk: typeof blobChunk;
declare const index_d$7_chunkBlob: typeof chunkBlob;
declare const index_d$7_chunkJson: typeof chunkJson;
declare const index_d$7_chunkText: typeof chunkText;
declare const index_d$7_contextPrompt: typeof contextPrompt;
declare const index_d$7_fetchChunk: typeof fetchChunk;
declare const index_d$7_imageChunk: typeof imageChunk;
declare const index_d$7_isChunk: typeof isChunk;
declare const index_d$7_isDataChunk: typeof isDataChunk;
declare const index_d$7_isJsonChunk: typeof isJsonChunk;
declare const index_d$7_isProtoMessage: typeof isProtoMessage;
declare const index_d$7_isRefChunk: typeof isRefChunk;
declare const index_d$7_isTextChunk: typeof isTextChunk;
declare const index_d$7_jsonChunk: typeof jsonChunk;
declare const index_d$7_mediaStreamToAudioChunks: typeof mediaStreamToAudioChunks;
declare const index_d$7_parseMimetype: typeof parseMimetype;
declare const index_d$7_prompt: typeof prompt;
declare const index_d$7_promptLiteralWithMetadata: typeof promptLiteralWithMetadata;
declare const index_d$7_promptWithMetadata: typeof promptWithMetadata;
declare const index_d$7_stringifyMimetype: typeof stringifyMimetype;
declare const index_d$7_systemPrompt: typeof systemPrompt;
declare const index_d$7_textChunk: typeof textChunk;
declare const index_d$7_userPrompt: typeof userPrompt;
declare const index_d$7_videoChunk: typeof videoChunk;
declare const index_d$7_withMetadata: typeof withMetadata;
declare namespace index_d$7 {
  export { type index_d$7_AudioChunk as AudioChunk, index_d$7_JSON_MIME_TYPE as JSON_MIME_TYPE, type index_d$7_PlainTextChunk as PlainTextChunk, index_d$7_ROLE as ROLE, type index_d$7_Role as Role, index_d$7_TEXT_MIME_TYPE as TEXT_MIME_TYPE, type index_d$7_TextChunk as TextChunk, index_d$7_assistantPrompt as assistantPrompt, index_d$7_audioChunk as audioChunk, index_d$7_audioChunksToMediaStream as audioChunksToMediaStream, index_d$7_blobChunk as blobChunk, index_d$7_chunkBlob as chunkBlob, index_d$7_chunkJson as chunkJson, index_d$7_chunkText as chunkText, index_d$7_contextPrompt as contextPrompt, index_d$7_fetchChunk as fetchChunk, index_d$7_imageChunk as imageChunk, index_d$7_isChunk as isChunk, index_d$7_isDataChunk as isDataChunk, index_d$7_isJsonChunk as isJsonChunk, index_d$7_isProtoMessage as isProtoMessage, index_d$7_isRefChunk as isRefChunk, index_d$7_isTextChunk as isTextChunk, index_d$7_jsonChunk as jsonChunk, index_d$7_mediaStreamToAudioChunks as mediaStreamToAudioChunks, index_d$7_parseMimetype as parseMimetype, index_d$7_prompt as prompt, index_d$7_promptLiteralWithMetadata as promptLiteralWithMetadata, index_d$7_promptWithMetadata as promptWithMetadata, index_d$7_stringifyMimetype as stringifyMimetype, index_d$7_systemPrompt as systemPrompt, index_d$7_textChunk as textChunk, index_d$7_userPrompt as userPrompt, index_d$7_videoChunk as videoChunk, index_d$7_withMetadata as withMetadata };
}

/**
 * @fileoverview Internal methods for the SDK.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Provides a session. */
declare function sessionProvider(contextProvider: () => SessionContext): SessionProvider;

/**
 * @fileoverview Local session.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
declare const local: SessionProvider;

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare const debug: SessionContextMiddleware;

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare const index_d$6_debug: typeof debug;
declare namespace index_d$6 {
  export { index_d$6_debug as debug };
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare const index_d$5_local: typeof local;
declare const index_d$5_sessionProvider: typeof sessionProvider;
declare namespace index_d$5 {
  export { index_d$5_local as local, index_d$6 as middleware, index_d$5_sessionProvider as sessionProvider };
}

/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Well defined GenerateContent Action */
declare abstract class GenerateContent$1 extends Action {
    abstract run(session: Session, inputs: {
        prompt: Input;
    }, outputs: {
        response?: Output;
    }): Promise<void>;
}
/** Well defined Live Action */
declare abstract class Live$1 extends Action {
    abstract run(session: Session, inputs: {
        audio: Input<AudioChunk>;
        context?: Input;
        system?: Input;
    }, outputs: {
        audio?: Output<AudioChunk>;
        context?: Output;
    }): Promise<void>;
}

/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Reverse some content. */
declare class ReverseContent extends Action {
    run(session: Session, inputs: {
        prompt: Input;
    }, outputs: {
        response: Output;
    }): Promise<void>;
}

/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare class Live extends Live$1 {
    private readonly apiKey;
    private readonly model;
    constructor(apiKey: string, model?: string);
    run(session: Session, inputs: {
        audio: Input<AudioChunk>;
        context?: Input;
        system?: Input;
    }, outputs: {
        audio?: Output<AudioChunk>;
        context?: Output;
    }): Promise<void>;
}
/** Well defined GenerateContent Action */
declare class GenerateContent extends GenerateContent$1 {
    private readonly apiKey;
    private readonly model;
    constructor(apiKey: string, model: string);
    run(session: Session, inputs: {
        prompt: Input;
    }, outputs: {
        response?: Output;
    }): Promise<void>;
}

type genai_d_GenerateContent = GenerateContent;
declare const genai_d_GenerateContent: typeof GenerateContent;
type genai_d_Live = Live;
declare const genai_d_Live: typeof Live;
declare namespace genai_d {
  export { genai_d_GenerateContent as GenerateContent, genai_d_Live as Live };
}

/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace index_d$4 {
  export { genai_d as genai };
}

/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Converts a docUrl imput to docText. */
declare const docToText: Processor<'docUrl', 'docText'>;

/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare const index_d$3_docToText: typeof docToText;
declare namespace index_d$3 {
  export { index_d$3_docToText as docToText };
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type index_d$2_ReverseContent = ReverseContent;
declare const index_d$2_ReverseContent: typeof ReverseContent;
declare namespace index_d$2 {
  export { GenerateContent$1 as GenerateContent, Live$1 as Live, index_d$2_ReverseContent as ReverseContent, index_d$3 as drive, index_d$4 as google };
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Races a list of streams returning the first value to resolve from any stream.
 */
declare function merge<T extends ReadonlyArray<AsyncIterator<unknown> | AsyncIterable<unknown>>>(...arr: [...T]): T[number];

declare const index_d$1_merge: typeof merge;
declare namespace index_d$1 {
  export { index_d$1_merge as merge };
}

/**
 * @fileoverview base64 helper utilities.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/** Encodes Uint8Array to base64 string. */
declare function encode(bytes: Uint8Array): string;
/** Decodes base64 string to Uint8Array. */
declare function decode(base64: string): Uint8Array;

declare const index_d_decode: typeof decode;
declare const index_d_encode: typeof encode;
declare namespace index_d {
  export { index_d_decode as decode, index_d_encode as encode };
}

export { Action, type ActionConstraints, type ActionInputs, type ActionOutputs, type Any, type Chunk, type ChunkMetadata, type Content, type DataChunk, type Dict, type Input, type MetadataChunk, type Mimetype, type Output, type Pipe, type Processor, type ProcessorChunks, type ProcessorConstraints, type ProcessorInputs, type ProcessorOutputs, type RefChunk, type Session, type SessionContext, type SessionContextMiddleware, type SessionProvider, type SessionWriteOptions, index_d$2 as actions, index_d$1 as async, index_d as base64, index_d$7 as content, index_d$5 as sessions };
