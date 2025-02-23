/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Chunk } from "../interfaces";
import { AudioChunk } from "./content";
/** Converts Audio Chunks to a Media Stream. */
export declare function audioChunksToMediaStream(chunks: AsyncIterable<Chunk>): MediaStream;
/** Converts a Media Stream to audio chunks. */
export declare function mediaStreamToAudioChunks(media: MediaStream): AsyncGenerator<AudioChunk>;
