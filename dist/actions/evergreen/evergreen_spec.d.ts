/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/** ISO date timestamp. */
export declare type Timestamp = string;
/** Any proto. */
export declare interface Any {
    '@type': string;
    [key: string]: undefined | null | string | number | boolean | object;
}
/** Session message. */
export declare interface SessionMessage {
    nodeFragments?: NodeFragment[];
    actions?: Action[];
}
/** Node. */
export declare interface Node {
    id?: string;
    childIds?: string[];
    chunk?: Chunk;
}
/** Node fragment. */
export declare interface NodeFragment {
    id?: string;
    seq?: number;
    continued?: boolean;
    childIds?: string[];
    chunkFragment?: Chunk;
}
/** Chunk. */
export declare interface Chunk {
    metadata?: ChunkMetadata;
    ref?: string;
    data?: string;
}
/** Chunk metadata. */
export declare interface ChunkMetadata {
    mimetype?: string;
    role?: string;
    originalFileName?: string;
    captureTime?: Timestamp;
    experimental?: Any[];
}
/** Named parameter. */
export declare interface NamedParameter {
    name?: string;
    id?: string;
}
/** Target spec. */
export declare interface TargetSpec {
    id?: string;
}
/** Action. */
export declare interface Action {
    targetSpec: TargetSpec;
    name: string;
    inputs?: NamedParameter[];
    outputs?: NamedParameter[];
    configs?: Any[];
}
