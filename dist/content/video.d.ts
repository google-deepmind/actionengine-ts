/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Chunk } from "../interfaces.js";
import { ImageChunk } from "./content.js";
/** Converts image chunks to a Media Stream. */
export declare function imageChunksToMediaStream(chunks: AsyncIterable<Chunk>, options?: {
    frameRate?: number;
}): MediaStream;
interface MediaToImageOptions {
    frameRate: number;
    scale: number;
}
/** Converts a Media Stream to image chunks. */
export declare function mediaStreamToImageChunks(media: MediaStream, options?: Partial<MediaToImageOptions>): AsyncGenerator<ImageChunk>;
export {};
