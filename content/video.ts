/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chunk } from "../interfaces.js";
import { dataUrlFromBlob, fetchChunk, ImageChunk } from "./content.js";
import { stringifyMimetype } from "./mime.js";

/** Converts image chunks to a Media Stream. */
export function imageChunksToMediaStream(chunks: AsyncIterable<Chunk>, options?: { frameRate?: number }): MediaStream {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let first = true;
    async function read() {
        try {
            for await (const c of chunks) {
                if (c.metadata?.mimetype?.type !== 'image') {
                    continue;
                }
                const img = new Image();
                if (c.data) {
                    img.src = await dataUrlFromBlob(new Blob([c.data], { type: stringifyMimetype(c.metadata?.mimetype) }));
                } else {
                    throw new Error(`Not yet implemented ${JSON.stringify(c)}`)
                }
                if (first) {
                    first = false;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    console.log(canvas.width, canvas.height);
                }
                ctx?.drawImage(img, 0, 0);
            }
        } finally {
            stream.getTracks().forEach(track => { track.stop(); });
        }
    }
    void read();
    const stream = canvas.captureStream(options?.frameRate);
    return stream;
}

interface MediaToImageOptions {
    frameRate: number;
    scale: number;
}

const mediaToImageOptions: MediaToImageOptions = { frameRate: 1, scale: 0.5 } as const;

/** Converts a Media Stream to image chunks. */
export async function* mediaStreamToImageChunks(media: MediaStream, options: Partial<MediaToImageOptions> = {}): AsyncGenerator<ImageChunk> {
    const opts = { ...mediaToImageOptions, ...options };
    const video = document.createElement('video');
    video.srcObject = media;
    video.autoplay = true;
    video.muted = true;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth * opts.scale;
    canvas.height = video.videoHeight * opts.scale;
    const ctx = canvas.getContext('2d');

    while (true) {
        if (!media.active) {
            break;
        }
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        yield (await fetchChunk(fetch(dataUrl))) as ImageChunk;
        await new Promise((resolve) => {
            setTimeout(resolve, 1000.0 / opts.frameRate);
        });
    }
}