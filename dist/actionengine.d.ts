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
/** Placeholder to write or read a tree or chunk fragments to later. */
interface Stream<T> extends ReadableStream<T>, WritableStream<T> {
    readonly isClosed: boolean;
    readonly size: number;
    readonly items: StreamItems<T>[];
    rawAsyncIterator(): AsyncIterator<StreamItems<T>>;
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** google.protobuf.Any proto mapping. */
declare interface Any$1 {
    readonly '@type': string;
    readonly [key: string]: undefined | null | string | number | boolean | object;
}
/** Metadata for a chunk. */
declare interface ChunkMetadata$1 {
    readonly mimetype?: Mimetype;
    readonly role?: string;
    readonly captureTime?: Date;
    readonly experimental?: Any$1[];
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
    readonly metadata?: ChunkMetadata$1;
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
type Chunk$1 = DataChunk | RefChunk;
type Content<T extends Chunk$1 = Chunk$1> = StreamItems<T>;
type Input<T extends Chunk$1 = Chunk$1> = ReadableStream<T>;
type Output<T extends Chunk$1 = Chunk$1> = WritableStream<T>;
interface Pipe<T extends Chunk$1 = Chunk$1> extends Input<T>, Output<T> {
}
type Dict<T, U extends string = string> = Readonly<Record<U, T>>;
type StreamTypeOfDict<T extends Dict<unknown>> = T extends Dict<infer U> ? U extends WritableStream<infer V> ? V : never : never;
declare abstract class Action$1<T extends Dict<Input> = Dict<Input>, U extends Dict<Output> = Dict<Output>> {
    abstract run(session: Session, inputs: T, outputs: U): Promise<void>;
}
type ActionInputs$1<T extends Action$1> = T extends Action$1<infer U> ? U : never;
type ActionOutputs$1<T extends Action$1> = T extends Action$1<never, infer V> ? Dict<ReadableStream<StreamTypeOfDict<V>>, keyof V & string> : never;
type ActionConstraints<T extends Action$1> = keyof ActionOutputs$1<T> & string;
/** Simplified transform of a unified Chunk stream. */
type Processor<I extends string = string, O extends string = string, T extends Chunk$1 = Chunk$1, U extends Chunk$1 = Chunk$1> = (stream: AsyncIterable<[I, T]>) => AsyncGenerator<[O, U]>;
/** Processor Chunks. */
type ProcessorChunks<T extends string = string, U extends Chunk$1 = Chunk$1> = AsyncIterable<[T, U]>;
/** Input dict to a processor. */
type ProcessorInputs<T extends Processor> = T extends Processor<infer I, string, infer X> ? Record<I, AsyncIterable<X>> : never;
/** Output dict to a processor. */
type ProcessorOutputs<T extends Processor> = T extends Processor<never, infer O, never, infer Y> ? Record<O, ReadableStream<Y>> : never;
type ProcessorConstraints<T extends Processor> = keyof ProcessorOutputs<T> & string;
interface Session {
    createPipe<T extends Chunk$1>(content?: Content<T>): Pipe<T>;
    run<T extends Action$1, U extends ActionConstraints<T> = ActionConstraints<T>>(action: T, inputs: ActionInputs$1<T>, outputs: U[]): Pick<ActionOutputs$1<T>, U>;
    run<T extends Processor<any, any>, U extends ProcessorConstraints<T> = ProcessorConstraints<T>>(processor: T, inputs: ProcessorInputs<T>, outputs: U[]): Pick<ProcessorOutputs<T>, U>;
    close(): Promise<void>;
}
interface SessionWriteOptions {
    seq?: number;
    continued?: boolean;
}
interface SessionContext {
    read(id: string): AsyncIterable<Chunk$1>;
    write(id: string, chunk: Chunk$1, options?: SessionWriteOptions): Promise<void>;
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
declare function isChunk(maybeChunk: unknown): maybeChunk is Chunk$1;
/**
 * Creates a json chunk.
 */
declare function jsonChunk(json: any, metadata?: ChunkMetadata$1, replacer?: (this: any, key: string, value: any) => any): Chunk$1;
/**
 * Converts a chunk to json.
 */
declare function chunkJson(chunk: Chunk$1, reviver?: (this: any, key: string, value: any) => any): unknown;
/**
 * Creates a plain text chunk.
 */
declare function textChunk(text: string, metadata?: ChunkMetadata$1): PlainTextChunk;
/**
 * Converts a chunk to text.
 */
declare function chunkText(chunk: Chunk$1, throwOnError?: boolean): string;
/**
 * Converts a chunk to a blob.
 */
declare function chunkBlob(chunk: Chunk$1): Blob;
/**
 * Converts a image to a chunk.
 */
declare function imageChunk(image: HTMLImageElement, metadata?: ChunkMetadata$1): Promise<Chunk$1>;
/**
 * Returns a data url from a blob.
 */
declare function dataUrlFromBlob(blob: Blob): Promise<string>;
/**
 * Converts a audio to a chunk.
 */
declare function audioChunk(audio: HTMLAudioElement, metadata?: ChunkMetadata$1): Promise<Chunk$1>;
/**
 * Converts a video to a chunk.
 */
declare function videoChunk(video: HTMLVideoElement, metadata?: ChunkMetadata$1): Promise<Chunk$1>;
/**
 * Converts a fetch resource to a chunk.
 */
declare function fetchChunk(resp: Promise<Response> | Response, metadata?: ChunkMetadata$1): Promise<Chunk$1>;
/**
 * Converts a blob to a chunk.
 */
declare function blobChunk(blob: Blob, metadata?: ChunkMetadata$1): Promise<Chunk$1>;
/**
 * Returns a chunk with the given metadata.
 */
declare function withMetadata<T extends Chunk$1>(chunk: T, metadata: ChunkMetadata$1): T;
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
declare type PlainTextChunk = Chunk$1 & {
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
declare type TextChunk = Chunk$1 & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'text';
        };
    };
};
/**
 * Type of a audio chunk.
 */
declare type AudioChunk = Chunk$1 & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'audio';
        };
    };
};
/**
 * Type of a image chunk.
 */
declare type ImageChunk = Chunk$1 & {
    readonly metadata: {
        readonly mimetype: {
            readonly type: 'image';
        };
    };
};
/**
 * Type of a video chunk.
 */
declare type VideoChunk = Chunk$1 & {
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
declare function promptLiteralWithMetadata(metadataFn?: (chunk: Chunk$1) => ChunkMetadata$1): (strings: TemplateStringsArray, ...values: unknown[]) => Content;
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
declare function promptWithMetadata(prompt: Content, metadata: ChunkMetadata$1): Content;

/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Converts Audio Chunks to a Media Stream. */
declare function audioChunksToMediaStream(chunks: AsyncIterable<Chunk$1>): MediaStream;
/** Converts a Media Stream to audio chunks. */
declare function mediaStreamToAudioChunks(media: MediaStream): AsyncGenerator<AudioChunk>;

/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Converts image chunks to a Media Stream. */
declare function imageChunksToMediaStream(chunks: AsyncIterable<Chunk$1>, options?: {
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

type index_d$9_AudioChunk = AudioChunk;
type index_d$9_ImageChunk = ImageChunk;
declare const index_d$9_JSON_MIME_TYPE: typeof JSON_MIME_TYPE;
type index_d$9_PlainTextChunk = PlainTextChunk;
type index_d$9_ROLE = ROLE;
declare const index_d$9_ROLE: typeof ROLE;
type index_d$9_Role = Role;
declare const index_d$9_TEXT_MIME_TYPE: typeof TEXT_MIME_TYPE;
type index_d$9_TextChunk = TextChunk;
type index_d$9_VideoChunk = VideoChunk;
declare const index_d$9_assistantPrompt: typeof assistantPrompt;
declare const index_d$9_audioChunk: typeof audioChunk;
declare const index_d$9_audioChunksToMediaStream: typeof audioChunksToMediaStream;
declare const index_d$9_blobChunk: typeof blobChunk;
declare const index_d$9_chunkBlob: typeof chunkBlob;
declare const index_d$9_chunkJson: typeof chunkJson;
declare const index_d$9_chunkText: typeof chunkText;
declare const index_d$9_contextPrompt: typeof contextPrompt;
declare const index_d$9_dataUrlFromBlob: typeof dataUrlFromBlob;
declare const index_d$9_fetchChunk: typeof fetchChunk;
declare const index_d$9_imageChunk: typeof imageChunk;
declare const index_d$9_imageChunksToMediaStream: typeof imageChunksToMediaStream;
declare const index_d$9_isChunk: typeof isChunk;
declare const index_d$9_isDataChunk: typeof isDataChunk;
declare const index_d$9_isJsonChunk: typeof isJsonChunk;
declare const index_d$9_isProtoMessage: typeof isProtoMessage;
declare const index_d$9_isRefChunk: typeof isRefChunk;
declare const index_d$9_isTextChunk: typeof isTextChunk;
declare const index_d$9_jsonChunk: typeof jsonChunk;
declare const index_d$9_mediaStreamToAudioChunks: typeof mediaStreamToAudioChunks;
declare const index_d$9_mediaStreamToImageChunks: typeof mediaStreamToImageChunks;
declare const index_d$9_parseMimetype: typeof parseMimetype;
declare const index_d$9_prompt: typeof prompt;
declare const index_d$9_promptLiteralWithMetadata: typeof promptLiteralWithMetadata;
declare const index_d$9_promptWithMetadata: typeof promptWithMetadata;
declare const index_d$9_stringifyMimetype: typeof stringifyMimetype;
declare const index_d$9_systemPrompt: typeof systemPrompt;
declare const index_d$9_textChunk: typeof textChunk;
declare const index_d$9_userPrompt: typeof userPrompt;
declare const index_d$9_videoChunk: typeof videoChunk;
declare const index_d$9_withMetadata: typeof withMetadata;
declare namespace index_d$9 {
  export { index_d$9_JSON_MIME_TYPE as JSON_MIME_TYPE, index_d$9_ROLE as ROLE, index_d$9_TEXT_MIME_TYPE as TEXT_MIME_TYPE, index_d$9_assistantPrompt as assistantPrompt, index_d$9_audioChunk as audioChunk, index_d$9_audioChunksToMediaStream as audioChunksToMediaStream, index_d$9_blobChunk as blobChunk, index_d$9_chunkBlob as chunkBlob, index_d$9_chunkJson as chunkJson, index_d$9_chunkText as chunkText, index_d$9_contextPrompt as contextPrompt, index_d$9_dataUrlFromBlob as dataUrlFromBlob, index_d$9_fetchChunk as fetchChunk, index_d$9_imageChunk as imageChunk, index_d$9_imageChunksToMediaStream as imageChunksToMediaStream, index_d$9_isChunk as isChunk, index_d$9_isDataChunk as isDataChunk, index_d$9_isJsonChunk as isJsonChunk, index_d$9_isProtoMessage as isProtoMessage, index_d$9_isRefChunk as isRefChunk, index_d$9_isTextChunk as isTextChunk, index_d$9_jsonChunk as jsonChunk, index_d$9_mediaStreamToAudioChunks as mediaStreamToAudioChunks, index_d$9_mediaStreamToImageChunks as mediaStreamToImageChunks, index_d$9_parseMimetype as parseMimetype, index_d$9_prompt as prompt, index_d$9_promptLiteralWithMetadata as promptLiteralWithMetadata, index_d$9_promptWithMetadata as promptWithMetadata, index_d$9_stringifyMimetype as stringifyMimetype, index_d$9_systemPrompt as systemPrompt, index_d$9_textChunk as textChunk, index_d$9_userPrompt as userPrompt, index_d$9_videoChunk as videoChunk, index_d$9_withMetadata as withMetadata };
  export type { index_d$9_AudioChunk as AudioChunk, index_d$9_ImageChunk as ImageChunk, index_d$9_PlainTextChunk as PlainTextChunk, index_d$9_Role as Role, index_d$9_TextChunk as TextChunk, index_d$9_VideoChunk as VideoChunk };
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

declare const index_d$8_debug: typeof debug;
declare namespace index_d$8 {
  export {
    index_d$8_debug as debug,
  };
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

declare const index_d$7_local: typeof local;
declare const index_d$7_sessionProvider: typeof sessionProvider;
declare namespace index_d$7 {
  export {
    index_d$7_local as local,
    index_d$8 as middleware,
    index_d$7_sessionProvider as sessionProvider,
  };
}

/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Well defined GenerateContent Action */
declare abstract class GenerateContent$1 extends Action$1 {
    abstract run(session: Session, inputs: {
        prompt: Input;
    }, outputs: {
        response?: Output;
    }): Promise<void>;
}
/** Well defined Live Action */
declare abstract class Live$1 extends Action$1 {
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
declare class ReverseContent extends Action$1 {
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

declare namespace index_d$6 {
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

declare const index_d$5_docToText: typeof docToText;
declare namespace index_d$5 {
  export {
    index_d$5_docToText as docToText,
  };
}

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
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/** ISO date timestamp. */
declare type Timestamp = string;
/** Any proto. */
declare interface Any {
    '@type': string;
    [key: string]: undefined | null | string | number | boolean | object;
}
/** Session message. */
declare interface SessionMessage {
    nodeFragments?: NodeFragment[];
    actions?: Action[];
}
/** Node. */
declare interface Node {
    id?: string;
    childIds?: string[];
    chunk?: Chunk;
}
/** Node fragment. */
declare interface NodeFragment {
    id?: string;
    seq?: number;
    continued?: boolean;
    childIds?: string[];
    chunkFragment?: Chunk;
}
/** Chunk. */
declare interface Chunk {
    metadata?: ChunkMetadata;
    ref?: string;
    data?: string;
}
/** Chunk metadata. */
declare interface ChunkMetadata {
    mimetype?: string;
    role?: string;
    originalFileName?: string;
    captureTime?: Timestamp;
    experimental?: Any[];
}
/** Named parameter. */
declare interface NamedParameter {
    name?: string;
    id?: string;
}
/** Target spec. */
declare interface TargetSpec {
    id?: string;
}
/** Action. */
declare interface Action {
    targetSpec: TargetSpec;
    name: string;
    inputs?: NamedParameter[];
    outputs?: NamedParameter[];
    configs?: Any[];
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
declare type ActionFromSchema<T extends ActionSchema> = Action$1<ActionInputs<T>, ActionOutputs<T>>;

/**
 * @fileoverview Abstractions for the network layer required to execute
 * Evergreen actions on remote servers from a web browser client. As well as
 * a default implementation that uses WebSockets for network transport.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Interface for callback functions that are invoked by the
 * `ConnectionManager` when a `SessionMessage` is received from the remote
 * server.
 */
type SessionMessageCallbackFn = (message: SessionMessage) => void;
/**
 * `ConnectionManager` is the interface between Evergreen action execution
 * methods defined in `run.ts` and the network transport used to communicate
 * with the remote server. `T` is the type of response message expected from
 * the remote server.
 */
declare interface ConnectionManager<T> {
    /**
     * Registers a `SesionMessageCallbackFn` to be invoked when a `SessionMessage`
     * is received from the remote server. If multiple callbacks are registered
     * then they will each be invoked for each `SessionMessage` received.
     */
    registerSessionMessageCallback(callback: SessionMessageCallbackFn): void;
    /**
     * Establish a connection to the remote server. This is a no-op if the
     * connection is already established.
     */
    connect(): Promise<void>;
    /**
     * End the connection to the remote server. This is a no-op if the connection
     * is already closed or was never established.
     */
    disconnect(): void;
    /**
     * Send a message to the remote server.
     */
    send(message: SessionMessage): void;
    /**
     * Callback that is invoked when a response is received from the
     * remote server. Note that implementers of this interface must ensure
     * that this callback is invoked e.g. by registering an event listener
     * on the underlying network connection.
     */
    onServerResponse(message: T): Promise<void>;
    /**
     * Callback that is invoked when an error is received from the remote server.
     * Note that implementers of this interface must ensure that this callback is
     * invoked e.g. by registering an event listener on the underlying network
     * connection.
     */
    onError(event: any): void;
    /**
     * Callback that is invoked when the connection is closed. Note that
     * implementers of this interface must ensure that this callback is invoked
     * e.g. by registering an event listener on the underlying network connection.
     */
    onClose(event: any): void;
    /**
     * Returns `true` if the connection is considered "valid" and `false`
     * otherwise. The exact semantics of valid and invalid are up to the
     * interface implementer. A connection which is invalid will be disposed
     * of and a new connection will be created to replace it.
     */
    isValidConnection(): boolean;
}
/**
 * Abstract base implementation of the `ConnectionManager` interface. This
 * base class provides a default implementation of the `onServerResponse`
 * method. The default implementation converts the raw server response into
 * a `SessionMessage` object and notifies any registered callbacks of the newly
 * available `SessionMessage`. Implementers must provide their own concrete
 * implementation of the `convertServerResponseToSessionMessage` method which
 * performs the conversion from the raw server response to a `SessionMessage`
 * object.
 */
declare abstract class AbstractBaseConnectionManager<T> implements ConnectionManager<T> {
    private callbacks;
    /**
     * Method defined in interface. Registers the provided `callback` in an
     * internal array of callbacks. Each callback will be invoked when a new
     * `SessionMessage` is received from the remote server.
     */
    registerSessionMessageCallback(callback: SessionMessageCallbackFn): void;
    /**
     * Method defined in interface. Implementers must override this method with
     * a concrete implementation. Refer to interface documentation for more
     * details.
     */
    abstract connect(): Promise<void>;
    /**
     * Method defined in interface. Implementers must override this method with
     * a concrete implementation. Refer to interface documentation for more
     * details.
     */
    abstract disconnect(): void;
    /**
     * Method defined in interface. Implementers must override this method with
     * a concrete implementation. Refer to interface documentation for more
     * details.
     */
    abstract send(message: SessionMessage): void;
    /**
     * Method defined in interface. Implementers must override this method with
     * a concrete implementation. Refer to interface documentation for more
     * details.
     */
    abstract onError(event: any): void;
    /**
     * Method defined in interface. Implementers must override this method with
     * a concrete implementation. Refer to interface documentation for more
     * details.
     */
    abstract onClose(event: any): void;
    /**
     * Method defined in interface. Implementers must override this method with
     * a concrete implementation. Refer to interface documentation for more
     * details.
     */
    abstract isValidConnection(): boolean;
    /**
     * Default implementation of the `onServerResponse` method. This method
     * converts the raw server response into a `SessionMessage` object and emits
     * it via the registered callbacks. Implementers must provide their
     * own concrete implementation of the `convertServerResponseToSessionMessage`
     * method below.
     */
    onServerResponse(event: T): Promise<void>;
    /**
     * Converts the raw server response into a `SessionMessage` object. If the
     * response does not represent a valid `SessionMessage` then either an
     * error should be raised or `undefined` should be returned. If the response
     * is expected but simply doesn't represent a `SessionMessage`, e.g. the
     * response represents some network control metadata, then the appropriate
     * behavior is to return `undefined`. However, if the response is not
     * expected and represents an error, then an error should be raised.
     */
    protected abstract convertServerResponseToSessionMessage(event: T): Promise<SessionMessage | undefined>;
}
/**
 * Factory for creating `ConnectionManager`s. This factory caches
 * `ConnectionManager`s for a given `Session`. Previously cached
 * `ConnectionManager`s are only returned if they are considered "valid".
 * Implementers of the `ConnectionManager` interface must define what it means
 * for a connection to be valid or invalid. Typically this will be based on
 * the state of the underlying network connection, e.g. a `WebSocket` in the
 * `WebSocket.OPEN` state would be considered valid and all other states would
 * be considered invalid.
 */
declare class CachingConnectionManagerFactory<T> {
    private readonly connectionMap;
    private readonly createManagerFn;
    constructor(createManagerFn: (backendUrl: string) => ConnectionManager<T>);
    getConnection(session: Session, backendUrl: string): ConnectionManager<T>;
}

/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface StreamIdGenerator {
    generateStreamId(streamName: string): string;
}
declare class Options {
    readonly backend: string;
    readonly idGenerator: StreamIdGenerator;
    readonly connectionFactory: CachingConnectionManagerFactory<unknown>;
    constructor(backend: string, idGenerator: StreamIdGenerator, connectionFactory: CachingConnectionManagerFactory<unknown>);
}
/** Sets the backend address wss://myapi/address?key=mykey. */
declare function setBackend(address: string): void;
declare function action<T extends ActionSchema>(uri: string, action: T, options?: Options): ActionFromSchema<T>;

/**
 * @fileoverview Evergreen.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type index_d$4_AbstractBaseConnectionManager<T> = AbstractBaseConnectionManager<T>;
declare const index_d$4_AbstractBaseConnectionManager: typeof AbstractBaseConnectionManager;
type index_d$4_Action = Action;
type index_d$4_ActionFromSchema<T extends ActionSchema> = ActionFromSchema<T>;
type index_d$4_ActionInputNames<T extends ActionSchema> = ActionInputNames<T>;
type index_d$4_ActionInputs<T extends ActionSchema> = ActionInputs<T>;
type index_d$4_ActionOutputNames<T extends ActionSchema> = ActionOutputNames<T>;
type index_d$4_ActionOutputs<T extends ActionSchema> = ActionOutputs<T>;
type index_d$4_ActionSchema = ActionSchema;
type index_d$4_Any = Any;
type index_d$4_CachingConnectionManagerFactory<T> = CachingConnectionManagerFactory<T>;
declare const index_d$4_CachingConnectionManagerFactory: typeof CachingConnectionManagerFactory;
type index_d$4_Chunk = Chunk;
type index_d$4_ChunkMetadata = ChunkMetadata;
type index_d$4_ConnectionManager<T> = ConnectionManager<T>;
type index_d$4_GENERATE = GENERATE;
type index_d$4_NamedParameter = NamedParameter;
type index_d$4_NamedParameterSchema = NamedParameterSchema;
type index_d$4_Node = Node;
type index_d$4_NodeFragment = NodeFragment;
type index_d$4_Options = Options;
declare const index_d$4_Options: typeof Options;
type index_d$4_SessionMessage = SessionMessage;
type index_d$4_SessionMessageCallbackFn = SessionMessageCallbackFn;
type index_d$4_StreamIdGenerator = StreamIdGenerator;
type index_d$4_TargetSpec = TargetSpec;
type index_d$4_Timestamp = Timestamp;
declare const index_d$4_action: typeof action;
declare const index_d$4_setBackend: typeof setBackend;
declare namespace index_d$4 {
  export { index_d$4_AbstractBaseConnectionManager as AbstractBaseConnectionManager, index_d$4_CachingConnectionManagerFactory as CachingConnectionManagerFactory, index_d$4_Options as Options, index_d$4_action as action, index_d$4_setBackend as setBackend };
  export type { index_d$4_Action as Action, index_d$4_ActionFromSchema as ActionFromSchema, index_d$4_ActionInputNames as ActionInputNames, index_d$4_ActionInputs as ActionInputs, index_d$4_ActionOutputNames as ActionOutputNames, index_d$4_ActionOutputs as ActionOutputs, index_d$4_ActionSchema as ActionSchema, index_d$4_Any as Any, index_d$4_Chunk as Chunk, index_d$4_ChunkMetadata as ChunkMetadata, index_d$4_ConnectionManager as ConnectionManager, index_d$4_GENERATE as GENERATE, index_d$4_NamedParameter as NamedParameter, index_d$4_NamedParameterSchema as NamedParameterSchema, index_d$4_Node as Node, index_d$4_NodeFragment as NodeFragment, index_d$4_SessionMessage as SessionMessage, index_d$4_SessionMessageCallbackFn as SessionMessageCallbackFn, index_d$4_StreamIdGenerator as StreamIdGenerator, index_d$4_TargetSpec as TargetSpec, index_d$4_Timestamp as Timestamp };
}

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type index_d$3_ReverseContent = ReverseContent;
declare const index_d$3_ReverseContent: typeof ReverseContent;
declare namespace index_d$3 {
  export {
    GenerateContent$1 as GenerateContent,
    Live$1 as Live,
    index_d$3_ReverseContent as ReverseContent,
    index_d$5 as drive,
    index_d$4 as evergreen,
    index_d$6 as google,
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

declare const index_d$2_merge: typeof merge;
declare namespace index_d$2 {
  export {
    index_d$2_merge as merge,
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

declare const index_d$1_decode: typeof decode;
declare const index_d$1_encode: typeof encode;
declare namespace index_d$1 {
  export {
    index_d$1_decode as decode,
    index_d$1_encode as encode,
  };
}

/**
 * @fileoverview Library for working with lazy tree like stream of chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Constructor function for creating a stream object. */
declare function createStream<T>(): Stream<T>;
/**
 * Returns true if the provided object implements the AsyncIterator protocol via
 * implementing a `Symbol.asyncIterator` method.
 */
declare function isAsyncIterable<T = unknown>(maybeAsyncIterable: unknown): maybeAsyncIterable is AsyncIterable<T>;
/** A function to aggregate an AsyncIterable to a PromiseLike thenable. */
declare function thenableAsyncIterable<T, TResult1 = T[], TResult2 = never>(this: AsyncIterable<T>, onfulfilled?: ((value: T[]) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null): Promise<TResult1 | TResult2>;
/** Make an asyncIterable PromiseLike. */
declare function awaitableAsyncIterable<T>(iter: AsyncIterable<T>): AsyncIterable<T> & PromiseLike<T[]>;

/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type index_d_ReadableStream<T> = ReadableStream<T>;
type index_d_Stream<T> = Stream<T>;
type index_d_StreamItems<T> = StreamItems<T>;
type index_d_WritableStream<T> = WritableStream<T>;
declare const index_d_awaitableAsyncIterable: typeof awaitableAsyncIterable;
declare const index_d_createStream: typeof createStream;
declare const index_d_isAsyncIterable: typeof isAsyncIterable;
declare const index_d_thenableAsyncIterable: typeof thenableAsyncIterable;
declare namespace index_d {
  export { index_d_awaitableAsyncIterable as awaitableAsyncIterable, index_d_createStream as createStream, index_d_isAsyncIterable as isAsyncIterable, index_d_thenableAsyncIterable as thenableAsyncIterable };
  export type { index_d_ReadableStream as ReadableStream, index_d_Stream as Stream, index_d_StreamItems as StreamItems, index_d_WritableStream as WritableStream };
}

export { Action$1 as Action, index_d$3 as actions, index_d$2 as async, index_d$1 as base64, index_d$9 as content, index_d$7 as sessions, index_d as stream };
export type { ActionConstraints, ActionInputs$1 as ActionInputs, ActionOutputs$1 as ActionOutputs, Any$1 as Any, Chunk$1 as Chunk, ChunkMetadata$1 as ChunkMetadata, Content, DataChunk, Dict, Input, MetadataChunk, Mimetype, Output, Pipe, Processor, ProcessorChunks, ProcessorConstraints, ProcessorInputs, ProcessorOutputs, RefChunk, Session, SessionContext, SessionContextMiddleware, SessionProvider, SessionWriteOptions };
