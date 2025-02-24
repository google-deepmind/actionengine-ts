/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chunk } from "../interfaces";
import { AudioChunk } from "./content";

// TODO(doug): Parse sample rate and channels from the generator..
const DEFAULT_OUTPUT_SAMPLE_RATE = 24000;
const DEFAULT_INPUT_SAMPLE_RATE = 16000;
const DEFAULT_NUM_CHANNELS = 1;


async function decodeAudioData(
    chunk: Chunk,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const data = chunk.data;
    if (!data) {
        throw new Error('Chunk without data.');
    }

    const buffer = ctx.createBuffer(numChannels, data.length / 2 / numChannels, sampleRate);

    const mimetype = chunk.metadata?.mimetype;
    if (!mimetype) {
        throw new Error('Chunk without mimetype.');
    }
    if (mimetype.type === 'audio' && mimetype.subtype === 'ogg') {
        // TODO(doug): Audio ogg processing is not working properly.
        const blob = new Blob([data.buffer as BlobPart], { type: 'audio/ogg' });
        const oggBuffer = await ctx.decodeAudioData(await blob.arrayBuffer());
        for (let i = 0; i < numChannels; i++) {
            buffer.copyToChannel(oggBuffer.getChannelData(i), i);
        }
    } else if (mimetype.type === 'audio' && mimetype.subtype === 'pcm') {
        const dataInt16 = new Int16Array(data.buffer);
        const l = dataInt16.length;
        const dataFloat32 = new Float32Array(l);
        for (let i = 0; i < l; i++) {
            dataFloat32[i] = dataInt16[i] / 32768.0;
        }
        // Extract interleaved channels
        if (numChannels === 0) {
            buffer.copyToChannel(dataFloat32, 0);
        } else {
            for (let i = 0; i < numChannels; i++) {
                const channel = dataFloat32.filter(
                    (_, index) => index % numChannels === i,
                );
                buffer.copyToChannel(channel, i);
            }
        }
    } else {
        throw new Error(`Unsupported mime type: ${JSON.stringify(mimetype)}`);
    }
    return buffer;
}

/** Converts Audio Chunks to a Media Stream. */
export function audioChunksToMediaStream(chunks: AsyncIterable<Chunk>): MediaStream {
    const sampleRate = DEFAULT_OUTPUT_SAMPLE_RATE;
    const numChannels = DEFAULT_NUM_CHANNELS;

    const media = new MediaStream();

    function nextContext(currentCtx?: AudioContext): [AudioContext, MediaStreamAudioDestinationNode] {
        if (currentCtx) {
            void currentCtx.close();
        }
        const nextCtx = new AudioContext({ sampleRate });
        const nextDest = nextCtx.createMediaStreamDestination();
        media.getTracks().forEach((t) => {
            media.removeTrack(t);
        });
        nextDest.stream.getTracks().forEach((t) => {
            media.addTrack(t);
        });
        return [nextCtx, nextDest];
    };

    let [ctx, dest] = nextContext();

    async function read() {
        try {
            let nextStartTime = 0;
            for await (const chunk of chunks) {
                if (chunk.metadata?.mimetype?.type !== 'audio') {
                    continue;
                }

                const mimetypeParameters = chunk.metadata.mimetype.parameters;
                // Use sample rate from chunk if present.
                let chunkSampleRate = Number(mimetypeParameters?.['rate']);
                if (isNaN(chunkSampleRate)) {
                    chunkSampleRate = sampleRate;
                }

                // Has been a significant delay in next audio chunk.
                if (ctx.currentTime > nextStartTime) {
                    [ctx, dest] = nextContext(ctx);
                    nextStartTime = ctx.currentTime;
                }

                let audioBuffer: AudioBuffer;
                try {
                    audioBuffer = await decodeAudioData(chunk, ctx, sampleRate, numChannels);
                } catch (e) {
                    console.error('Error decoding audio data', e);
                    continue;
                }
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(dest);

                source.start(nextStartTime);
                nextStartTime = nextStartTime + audioBuffer.duration;
            }
            await ctx.close();
        } finally {
            if (ctx.state !== 'closed') {
                void ctx.close();
            }
        }
    }
    void read();
    return media;
}

/** Converts a Media Stream to audio chunks. */
export async function* mediaStreamToAudioChunks(media: MediaStream): AsyncGenerator<AudioChunk> {
    const sampleRate = DEFAULT_INPUT_SAMPLE_RATE;
    const ctx = new AudioContext({ sampleRate });
    const numChannels = DEFAULT_NUM_CHANNELS;
    const src = ctx.createMediaStreamSource(media);
    // TODO(doug): Use a worklet processor to convert to int16.
    const BUFFER_SIZE = 8192; // must be a power of 2 between 256 and 16384
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const processor = ctx.createScriptProcessor(
        BUFFER_SIZE,
        numChannels,
        numChannels,
    );
    const queue: AudioChunk[] = [];
    let resolver: ((value: AudioChunk) => void) | undefined = undefined;

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    processor.onaudioprocess = (e) => {
        // Data is float32, from -1 to 1.
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        const data = e.inputBuffer.getChannelData(0);
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            // convert float32 -1 to 1 to int16 -32768 to 32767
            int16[i] = data[i] * 32768;
        }
        const chunk: AudioChunk = {
            data: new Uint8Array(int16.buffer),
            metadata: {
                mimetype: {
                    type: 'audio',
                    subtype: 'pcm',
                    parameters: { 'rate': `${sampleRate}` },
                },
            },
        };
        if (resolver) {
            resolver(chunk);
            resolver = undefined;
        } else {
            queue.push(chunk);
        }
    };
    src.connect(processor);
    processor.connect(ctx.destination);
    try {
        while (true) {
            if (queue.length > 0) {
                const result = queue.shift();
                if (result === undefined) {
                    continue;
                }
                yield result;
            } else {
                const result = await new Promise<AudioChunk>((resolve) => {
                    resolver = resolve;
                });
                yield result;
            }
            if (!media.active) {
                break;
            }
        }
    } finally {
        await ctx.close();
    }
}
