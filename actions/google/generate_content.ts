/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input, Output, Session } from '../../interfaces.js';
import {GenerativeModel, GoogleGenerativeAI} from '@google/generative-ai';
import { GenerateContent } from '../generate_content.js';
import { chunkText, textChunk } from '../../content/content.js';


const clients = new Map<string, GoogleGenerativeAI>();
function genAI(apiKey: string) {
    let client = clients.get(apiKey);
    if (!client) {
        client = new GoogleGenerativeAI(apiKey);
        clients.set(apiKey, client);
    }
    return client;
}


/** Well defined GenerateContent Action */
export class GoogleGenerateContent extends GenerateContent {

    private model: GenerativeModel;

    constructor(apiKey: string, model: string) {
        super();
        this.model = genAI(apiKey).getGenerativeModel({model});
    }

     
    override async run(session: Session, inputs: { prompt: Input }, outputs: { response: Output }): Promise<void> {
        const prompt = await inputs.prompt;
        const promptString = prompt.map((c) => chunkText(c)).join("");
        const response = await this.model.generateContentStream(promptString);
        for await (const chunk of response.stream) {
            outputs.response.write(textChunk(chunk.text()));
        }
    }
}