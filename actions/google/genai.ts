
/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input, Output, Session } from '../../interfaces.js';
import * as genai from "@google/genai";
import { GenerateContent as AbstractGenerateContent } from '../generate_content.js';
import { chunkText, textChunk } from '../../content/content.js';


const clients = new Map<string, genai.Client>();
function genAI(apiKey: string) {
    let client = clients.get(apiKey);
    if (!client) {
        client = new genai.Client({vertexai: false, apiKey});
        clients.set(apiKey, client);
    }
    return client;
}


/** Well defined GenerateContent Action */
export class GenerateContent extends AbstractGenerateContent {

    constructor(private readonly apiKey: string, private readonly model: string) {
        super();
    }
     
    override async run(session: Session, inputs: { prompt: Input }, outputs: { response: Output }): Promise<void> {
        const prompt = await inputs.prompt;
        const promptString = prompt.map((c) => chunkText(c)).join("");
        const response = await genAI(this.apiKey).models.generateContentStream({
            model: this.model,
            contents: promptString,
        });
        for await (const chunk of response) {
            outputs.response.write(textChunk(chunk.text()));
        }
    }
}