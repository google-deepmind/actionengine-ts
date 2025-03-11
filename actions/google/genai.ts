
/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input, Output, Session, Chunk } from '../../interfaces.js';
import { GoogleGenAI, Modality, LiveConnectConfig, LiveServerMessage } from "@google/genai";
import { GenerateContent as AbstractGenerateContent, Live as AbstractLive } from '../common.js';
import { chunkText, textChunk, AudioChunk, ImageChunk } from '../../content/content.js';
import { parseMimetype, stringifyMimetype } from '../../content/mime.js';
import { encode as b64encode, decode as b64decode } from '../../base64/index.js';
import { merge } from '../../async/index.js';


const clients = new Map<string, GoogleGenAI>();
function genAI(apiKey: string) {
    let client = clients.get(apiKey);
    if (!client) {
        client = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });
        clients.set(apiKey, client);
    }
    return client;
}

export class Live extends AbstractLive {

    constructor(private readonly apiKey: string, private readonly model = 'gemini-2.0-flash-exp') {
        super();
    }

    override async run(session: Session,
        inputs: {
            audio?: Input<AudioChunk>,
            video?: Input<ImageChunk>,
            screen?: Input<ImageChunk>,
            context?: Input,
            system?: Input,
        },
        outputs: {
            audio?: Output<AudioChunk>,
            context?: Output,
        }): Promise<void> {

        const client = genAI(this.apiKey);
        const config: LiveConnectConfig = {
            responseModalities: [Modality.AUDIO]
        };

        if (inputs.system) {
            const system = await inputs.system;
            const systemString = system.map((c) => chunkText(c)).join("");
            config.systemInstruction = {
                parts: [{ text: systemString }],
            }
        }

        const live = await client.live.connect({
            model: this.model, config, callbacks: {
                onmessage: (e) => {
                    void onmessage(e);
                },
                onerror: (e) => {
                    console.log('error', e);
                },
                onclose: (e) => {
                    console.log('close', e);
                },
                onopen: () => {
                    console.log('open');
                },
            }
        });

        async function readInputs() {
            const arr = [inputs.audio, inputs.video, inputs.screen].filter((x) => !!x);
            if (arr.length === 0) return;
            for await (const chunk of merge(...arr)) {
                if (chunk.data) {
                    live.sendRealtimeInput({
                        media: {
                            mimeType: stringifyMimetype(chunk.metadata.mimetype),
                            data: b64encode(chunk.data),
                        }
                    });
                }
            }
        }

        async function readContext() {
            if (!inputs.context) {
                return;
            }
            for await (const chunk of inputs.context) {
                if (chunk.data) {
                    live.sendClientContent({
                        turns: [{
                            parts: [{
                                text: chunkText(chunk),
                            }],
                        }],
                        turnComplete: false,
                    });
                }
            }
        }

        async function onmessage(resp: LiveServerMessage) {
            if (resp.serverContent?.modelTurn) {
                const turn = resp.serverContent.modelTurn;
                if (turn.parts) {
                    for (const part of turn.parts) {
                        if (part.text) {
                            const chunk = textChunk(part.text);
                            await outputs.context?.write(chunk);
                        } else if (part.inlineData) {
                            const chunk: Chunk = {
                                data: b64decode(part.inlineData.data ?? ''),
                                metadata: {
                                    mimetype: parseMimetype(part.inlineData.mimeType),
                                }
                            };
                            if (chunk.metadata?.mimetype?.type === 'audio') {
                                await outputs.audio?.write(chunk as AudioChunk);
                            } else {
                                await outputs.context?.write(chunk);
                            }
                        }
                    }
                }
            }
            if (resp.serverContent?.turnComplete) {
                console.log('complete turn');
                return;
            }
            if (resp.serverContent?.interrupted) {
                console.log('interupted turn');
                return;
            }
            if (resp.toolCall) {
                console.log('toolCall');
                return;
            }
            if (resp.toolCallCancellation) {
                console.log('toolCancellation');
                return;
            }
        }

        async function writeOutputs() {
            await new Promise(() => {
                // TODO(doug): When should this actually finish and close.
                // await outputs.context?.close();
                // await outputs.audio?.close();
            });
        }

        void readInputs();
        void readContext();
        await writeOutputs();
    }
}


/** Well defined GenerateContent Action */
export class GenerateContent extends AbstractGenerateContent {

    constructor(private readonly apiKey: string, private readonly model: string) {
        super();
    }

    override async run(session: Session, inputs: { prompt: Input }, outputs: { response?: Output }): Promise<void> {
        if (!outputs.response) {
            return;
        }
        const prompt = await inputs.prompt;
        const promptString = prompt.map((c) => chunkText(c)).join("");
        const response = await genAI(this.apiKey).models.generateContentStream({
            model: this.model,
            contents: promptString,
        });
        for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
                await outputs.response.write(textChunk(text));
            }
        }
    }
}
