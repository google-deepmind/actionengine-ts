/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
type StreamItems<T> = T | AsyncIterable<StreamItems<T>> | StreamItems<T>[];
interface WritableStream<T> {
    write(value: StreamItems<T>): Promise<void>;
    writeAndClose(value: StreamItems<T>): Promise<void>;
    close(): Promise<void>;
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
    readonly parameters?: Record<string, string>;
}
/** Chunk with metadata. */
interface MetadataChunk {
    readonly metadata?: ChunkMetadata;
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
type ActionInputs$1<T extends Action> = T extends Action<infer U> ? U : never;
type ActionOutputs$1<T extends Action> = T extends Action<never, infer V> ? Dict<ReadableStream<StreamTypeOfDict<V>>, keyof V & string> : never;
type ActionConstraints<T extends Action> = keyof ActionOutputs$1<T> & string;
/** Simplified transform of a unified Chunk stream. */
type Processor<I extends string = string, O extends string = string, T extends Chunk = Chunk, U extends Chunk = Chunk> = (stream: AsyncIterable<[I, T]>) => AsyncGenerator<[O, U]>;
/** Processor Chunks. */
type ProcessorChunks<T extends string = string, U extends Chunk = Chunk> = AsyncIterable<[T, U]>;
/** Input dict to a processor. */
type ProcessorInputs<T extends Processor> = T extends Processor<infer I, string, infer X> ? Record<I, AsyncIterable<X>> : never;
/** Output dict to a processor. */
type ProcessorOutputs<T extends Processor> = T extends Processor<never, infer O, never, infer Y> ? Record<O, ReadableStream<Y>> : never;
type ProcessorConstraints<T extends Processor> = keyof ProcessorOutputs<T> & string;
interface Session {
    createPipe<T extends Chunk>(content?: Content<T>): Pipe<T>;
    run<T extends Action, U extends ActionConstraints<T> = ActionConstraints<T>>(action: T, inputs: ActionInputs$1<T>, outputs: U[]): Pick<ActionOutputs$1<T>, U>;
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
type SessionContextMiddleware = (context: SessionContext) => SessionContext;
type SessionProvider = (...middleware: SessionContextMiddleware[]) => Session;

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
 * Returns a data url from a blob.
 */
declare function dataUrlFromBlob(blob: Blob): Promise<string>;
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
 * Type of a image chunk.
 */
declare type ImageChunk = Chunk & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'image';
        };
    };
};
/**
 * Type of a video chunk.
 */
declare type VideoChunk = Chunk & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'video';
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
declare function audioChunksToMediaStream(chunks: AsyncIterable<Chunk>): MediaStream;
/** Converts a Media Stream to audio chunks. */
declare function mediaStreamToAudioChunks(media: MediaStream): AsyncGenerator<AudioChunk>;

/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Converts image chunks to a Media Stream. */
declare function imageChunksToMediaStream(chunks: AsyncIterable<Chunk>, options?: {
    frameRate?: number;
}): MediaStream;
interface MediaToImageOptions {
    frameRate: number;
    scale: number;
}
/** Converts a Media Stream to image chunks. */
declare function mediaStreamToImageChunks(media: MediaStream, options?: Partial<MediaToImageOptions>): AsyncGenerator<ImageChunk>;

/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

type index_d$8_AudioChunk = AudioChunk;
type index_d$8_ImageChunk = ImageChunk;
declare const index_d$8_JSON_MIME_TYPE: typeof JSON_MIME_TYPE;
type index_d$8_PlainTextChunk = PlainTextChunk;
type index_d$8_ROLE = ROLE;
declare const index_d$8_ROLE: typeof ROLE;
type index_d$8_Role = Role;
declare const index_d$8_TEXT_MIME_TYPE: typeof TEXT_MIME_TYPE;
type index_d$8_TextChunk = TextChunk;
type index_d$8_VideoChunk = VideoChunk;
declare const index_d$8_assistantPrompt: typeof assistantPrompt;
declare const index_d$8_audioChunk: typeof audioChunk;
declare const index_d$8_audioChunksToMediaStream: typeof audioChunksToMediaStream;
declare const index_d$8_blobChunk: typeof blobChunk;
declare const index_d$8_chunkBlob: typeof chunkBlob;
declare const index_d$8_chunkJson: typeof chunkJson;
declare const index_d$8_chunkText: typeof chunkText;
declare const index_d$8_contextPrompt: typeof contextPrompt;
declare const index_d$8_dataUrlFromBlob: typeof dataUrlFromBlob;
declare const index_d$8_fetchChunk: typeof fetchChunk;
declare const index_d$8_imageChunk: typeof imageChunk;
declare const index_d$8_imageChunksToMediaStream: typeof imageChunksToMediaStream;
declare const index_d$8_isChunk: typeof isChunk;
declare const index_d$8_isDataChunk: typeof isDataChunk;
declare const index_d$8_isJsonChunk: typeof isJsonChunk;
declare const index_d$8_isProtoMessage: typeof isProtoMessage;
declare const index_d$8_isRefChunk: typeof isRefChunk;
declare const index_d$8_isTextChunk: typeof isTextChunk;
declare const index_d$8_jsonChunk: typeof jsonChunk;
declare const index_d$8_mediaStreamToAudioChunks: typeof mediaStreamToAudioChunks;
declare const index_d$8_mediaStreamToImageChunks: typeof mediaStreamToImageChunks;
declare const index_d$8_parseMimetype: typeof parseMimetype;
declare const index_d$8_prompt: typeof prompt;
declare const index_d$8_promptLiteralWithMetadata: typeof promptLiteralWithMetadata;
declare const index_d$8_promptWithMetadata: typeof promptWithMetadata;
declare const index_d$8_stringifyMimetype: typeof stringifyMimetype;
declare const index_d$8_systemPrompt: typeof systemPrompt;
declare const index_d$8_textChunk: typeof textChunk;
declare const index_d$8_userPrompt: typeof userPrompt;
declare const index_d$8_videoChunk: typeof videoChunk;
declare const index_d$8_withMetadata: typeof withMetadata;
declare namespace index_d$8 {
  export { index_d$8_JSON_MIME_TYPE as JSON_MIME_TYPE, index_d$8_ROLE as ROLE, index_d$8_TEXT_MIME_TYPE as TEXT_MIME_TYPE, index_d$8_assistantPrompt as assistantPrompt, index_d$8_audioChunk as audioChunk, index_d$8_audioChunksToMediaStream as audioChunksToMediaStream, index_d$8_blobChunk as blobChunk, index_d$8_chunkBlob as chunkBlob, index_d$8_chunkJson as chunkJson, index_d$8_chunkText as chunkText, index_d$8_contextPrompt as contextPrompt, index_d$8_dataUrlFromBlob as dataUrlFromBlob, index_d$8_fetchChunk as fetchChunk, index_d$8_imageChunk as imageChunk, index_d$8_imageChunksToMediaStream as imageChunksToMediaStream, index_d$8_isChunk as isChunk, index_d$8_isDataChunk as isDataChunk, index_d$8_isJsonChunk as isJsonChunk, index_d$8_isProtoMessage as isProtoMessage, index_d$8_isRefChunk as isRefChunk, index_d$8_isTextChunk as isTextChunk, index_d$8_jsonChunk as jsonChunk, index_d$8_mediaStreamToAudioChunks as mediaStreamToAudioChunks, index_d$8_mediaStreamToImageChunks as mediaStreamToImageChunks, index_d$8_parseMimetype as parseMimetype, index_d$8_prompt as prompt, index_d$8_promptLiteralWithMetadata as promptLiteralWithMetadata, index_d$8_promptWithMetadata as promptWithMetadata, index_d$8_stringifyMimetype as stringifyMimetype, index_d$8_systemPrompt as systemPrompt, index_d$8_textChunk as textChunk, index_d$8_userPrompt as userPrompt, index_d$8_videoChunk as videoChunk, index_d$8_withMetadata as withMetadata };
  export type { index_d$8_AudioChunk as AudioChunk, index_d$8_ImageChunk as ImageChunk, index_d$8_PlainTextChunk as PlainTextChunk, index_d$8_Role as Role, index_d$8_TextChunk as TextChunk, index_d$8_VideoChunk as VideoChunk };
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

declare const index_d$7_debug: typeof debug;
declare namespace index_d$7 {
  export {
    index_d$7_debug as debug,
  };
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare const index_d$6_local: typeof local;
declare const index_d$6_sessionProvider: typeof sessionProvider;
declare namespace index_d$6 {
  export {
    index_d$6_local as local,
    index_d$7 as middleware,
    index_d$6_sessionProvider as sessionProvider,
  };
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
        audio?: Input<AudioChunk>;
        video?: Input<ImageChunk>;
        screen?: Input<ImageChunk>;
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
        audio?: Input<AudioChunk>;
        video?: Input<ImageChunk>;
        screen?: Input<ImageChunk>;
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
  export {
    genai_d_GenerateContent as GenerateContent,
    genai_d_Live as Live,
  };
}

/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace index_d$5 {
  export {
    genai_d as genai,
  };
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

declare const index_d$4_docToText: typeof docToText;
declare namespace index_d$4 {
  export {
    index_d$4_docToText as docToText,
  };
}

/**
 * @fileoverview Evergreen interfaces.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Named parameter spec. */
declare interface NamedParameterSchema {
    readonly name: string;
    readonly description: string;
    readonly type: readonly Mimetype[];
}
/** Action spec. */
declare interface ActionSchema {
    readonly name: string;
    readonly inputs: readonly NamedParameterSchema[];
    readonly outputs: readonly NamedParameterSchema[];
}
/** Action input names. */
declare type ActionInputNames<T extends ActionSchema> = T['inputs'][number]['name'];
/** Action inputs. */
declare type ActionInputs<T extends ActionSchema> = Readonly<Record<ActionInputNames<T>, Input>>;
/** Action output names. */
declare type ActionOutputNames<T extends ActionSchema> = T['outputs'][number]['name'];
/** Action outputs. */
declare type ActionOutputs<T extends ActionSchema> = Readonly<Record<ActionOutputNames<T>, Output>>;
declare type ActionFromSchema<T extends ActionSchema> = Action<ActionInputs<T>, ActionOutputs<T>>;

/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Sets the backend address wss://myapi/adddress?key=mykey. */
declare function setBackend(address: string): void;
declare function action<T extends ActionSchema>(uri: string, action: T): ActionFromSchema<T>;

/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/** Generate action */
declare const GENERATE: {
    readonly name: "GENERATE";
    readonly inputs: readonly [{
        readonly name: "prompt";
        readonly description: "The prompt to generate from";
        readonly type: readonly [{
            readonly type: "text";
            readonly subtype: "plain";
        }, {
            readonly type: "image";
            readonly subtype: "png";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "response";
        readonly description: "The response from the model";
        readonly type: readonly [{
            readonly type: "text";
            readonly subtype: "plain";
        }, {
            readonly type: "image";
            readonly subtype: "png";
        }];
    }];
};
/** Generate action type */
type GENERATE = typeof GENERATE;

/**
 * @fileoverview Evergreen.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type index_d$3_ActionFromSchema<T extends ActionSchema> = ActionFromSchema<T>;
type index_d$3_ActionInputNames<T extends ActionSchema> = ActionInputNames<T>;
type index_d$3_ActionInputs<T extends ActionSchema> = ActionInputs<T>;
type index_d$3_ActionOutputNames<T extends ActionSchema> = ActionOutputNames<T>;
type index_d$3_ActionOutputs<T extends ActionSchema> = ActionOutputs<T>;
type index_d$3_ActionSchema = ActionSchema;
type index_d$3_GENERATE = GENERATE;
type index_d$3_NamedParameterSchema = NamedParameterSchema;
declare const index_d$3_action: typeof action;
declare const index_d$3_setBackend: typeof setBackend;
declare namespace index_d$3 {
  export { index_d$3_action as action, index_d$3_setBackend as setBackend };
  export type { index_d$3_ActionFromSchema as ActionFromSchema, index_d$3_ActionInputNames as ActionInputNames, index_d$3_ActionInputs as ActionInputs, index_d$3_ActionOutputNames as ActionOutputNames, index_d$3_ActionOutputs as ActionOutputs, index_d$3_ActionSchema as ActionSchema, index_d$3_GENERATE as GENERATE, index_d$3_NamedParameterSchema as NamedParameterSchema };
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type index_d$2_ReverseContent = ReverseContent;
declare const index_d$2_ReverseContent: typeof ReverseContent;
declare namespace index_d$2 {
  export {
    GenerateContent$1 as GenerateContent,
    Live$1 as Live,
    index_d$2_ReverseContent as ReverseContent,
    index_d$4 as drive,
    index_d$3 as evergreen,
    index_d$5 as google,
  };
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Races a list of streams returning the first value to resolve from any stream.
 */
declare function merge<T extends readonly (AsyncIterator<unknown> | AsyncIterable<unknown>)[]>(...arr: [...T]): T[number];

declare const index_d$1_merge: typeof merge;
declare namespace index_d$1 {
  export {
    index_d$1_merge as merge,
  };
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
  export {
    index_d_decode as decode,
    index_d_encode as encode,
  };
}

export { Action, index_d$2 as actions, index_d$1 as async, index_d as base64, index_d$8 as content, index_d$6 as sessions };
export type { ActionConstraints, ActionInputs$1 as ActionInputs, ActionOutputs$1 as ActionOutputs, Any, Chunk, ChunkMetadata, Content, DataChunk, Dict, Input, MetadataChunk, Mimetype, Output, Pipe, Processor, ProcessorChunks, ProcessorConstraints, ProcessorInputs, ProcessorOutputs, RefChunk, Session, SessionContext, SessionContextMiddleware, SessionProvider, SessionWriteOptions };
