/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chunk } from "../interfaces";
import { blobChunk, dataUrlFromBlob, ImageChunk } from "./content";
import { stringifyMimetype } from "./mime";

/** Converts image chunks to a Media Stream. */
export function imageChunksToMediaStream(chunks: AsyncIterable<Chunk>, options?: {frameRate?: number}): MediaStream {
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
                    img.src = await dataUrlFromBlob(new Blob([c.data], {type: stringifyMimetype(c.metadata?.mimetype)}));
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
            stream.getTracks().forEach(track => {track.stop();});
        }
    }
    void read();
    const stream = canvas.captureStream(options?.frameRate);
    return stream; 
}

/** Converts a Media Stream to image chunks. */
export async function* mediaStreamToImageChunks(media: MediaStream, options?: {frameRate?: number}): AsyncGenerator<ImageChunk> {
    const video = document.createElement('video');
    video.srcObject = media;
    video.autoplay = true;
    video.muted = true;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    await new Promise<void>((resolve, reject) => {
        video.addEventListener('loadeddata', () => {
            resolve();
        });
        video.addEventListener('error', (e) => {
          reject(new Error(`${e.error}`));
        });
    });

    while(true) {
      if (!media.active) {
        break;
      }
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b: Blob|null) => {
            if (b === null) {
                reject(new Error('invalid blob'));
            } else {
                resolve(b);
            }
        });
      });
      yield (await blobChunk(frameData)) as ImageChunk;
      await new Promise((resolve) => {
        setTimeout(resolve, (options?.frameRate ?? 1) * 1000);
      });
    }
}