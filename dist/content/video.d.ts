/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Chunk } from "../interfaces";
import { ImageChunk } from "./content";
/** Converts image chunks to a Media Stream. */
export declare function imageChunksToMediaStream(chunks: AsyncIterable<Chunk>, options?: {
    frameRate?: number;
}): MediaStream;
/** Converts a Media Stream to image chunks. */
export declare function mediaStreamToImageChunks(media: MediaStream, options?: {
    frameRate?: number;
}): AsyncGenerator<ImageChunk>;
