/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Input, Output, Session } from '../../interfaces.js';
import { GenerateContent as AbstractGenerateContent, Live as AbstractLive } from '../common.js';
import { AudioChunk } from '../../content/content.js';
export declare class Live extends AbstractLive {
    private readonly apiKey;
    private readonly model;
    constructor(apiKey: string, model?: string);
    run(session: Session, inputs: {
        audio: Input<AudioChunk>;
        context?: Input;
        system?: Input;
    }, outputs: {
        audio?: Output<AudioChunk>;
        context?: Output;
    }): Promise<void>;
}
/** Well defined GenerateContent Action */
export declare class GenerateContent extends AbstractGenerateContent {
    private readonly apiKey;
    private readonly model;
    constructor(apiKey: string, model: string);
    run(session: Session, inputs: {
        prompt: Input;
    }, outputs: {
        response?: Output;
    }): Promise<void>;
}
