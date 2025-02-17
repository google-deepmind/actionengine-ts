
/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input, Output, Session, Chunk } from '../../interfaces.js';
import * as genai from "@google/genai";
import { GenerateContent as AbstractGenerateContent, Live as AbstractLive } from '../common.js';
import { chunkText, textChunk, AudioChunk } from '../../content/content.js';
import { parseMimetype, stringifyMimetype } from '../../content/mime.js';
import { encode as b64encode, decode as b64decode } from '../../base64/index.js';


const clients = new Map<string, genai.Client>();
function genAI(apiKey: string) {
    let client = clients.get(apiKey);
    if (!client) {
        client = new genai.Client({vertexai: false, apiKey});
        clients.set(apiKey, client);
    }
    return client;
}

export class Live extends AbstractLive {

    constructor(private readonly apiKey: string, private readonly model = 'gemini-2.0-flash-exp') {
        super();
    }

    override async run(session: Session, inputs: { audio: Input<AudioChunk>, context?: Input, system?: Input }, outputs: { audio?: Output<AudioChunk>, context?: Output }): Promise<void> {
        const client = genAI(this.apiKey);
        const config: genai.LiveConnectConfig = {};

        if (inputs.system) {
            const system = await inputs.system;
            const systemString = system.map((c) => chunkText(c)).join("");
            config.systemInstruction = {
                parts: [{text: systemString}],
            }
        }
        
        const live = await client.live.connect(this.model, config);

        async function readAudio() {
            for await (const chunk of inputs.audio) {
                if (chunk.data) {
                    const i: genai.LiveClientRealtimeInput = {
                        mediaChunks: [{
                            mimeType: stringifyMimetype(chunk.metadata.mimetype),
                            data: b64encode(chunk.data),
                    }]};
                    live.send(i);
                }
            }
        }
        
        async function readContext() {
            if (!inputs.context) {
                return;
            }
            for await (const chunk of inputs.context) {
                if (chunk.data) {
                    const i: genai.LiveClientContent = {
                        turns: [{
                            parts: [{
                                text: chunkText(chunk),
                            }],
                        }],
                        turnComplete: true,
                    };
                    live.send(i);
                }
            }
        }

        async function writeOutputs() {
            while(true) {
                const resp = await live.receive();
                if (resp.serverContent?.modelTurn) {
                    const turn = resp.serverContent.modelTurn;
                    console.log(turn);
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
                    console.log('complete');
                    continue;
                }
                if (resp.serverContent?.interrupted) {
                    console.log('interupted');
                    continue;
                }
                if (resp.toolCall) {
                    console.log('toolCall');
                    continue;
                }
                if (resp.toolCallCancellation) {
                    console.log('toolCancellation');
                    continue;
                }
            }
            await outputs.context?.close();
            await outputs.audio?.close();
        }

        void readAudio();
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
            const text = chunk.text();
            if (text) {
                await outputs.response.write(textChunk(text));
            }
        }
    }
}