/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Input, Output, Session } from '../../interfaces.js';
import { GenerateContent as AbstractGenerateContent } from '../generate_content.js';
/** Well defined GenerateContent Action */
export declare class GenerateContent extends AbstractGenerateContent {
    private readonly apiKey;
    private readonly model;
    constructor(apiKey: string, model: string);
    run(session: Session, inputs: {
        prompt: Input;
    }, outputs: {
        response: Output;
    }): Promise<void>;
}
