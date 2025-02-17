/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Input, Output, Action, Session } from '../interfaces.js';
import { chunkText, textChunk, ROLE} from '../content/content.js';

/** Reverse some content. */
export class ReverseContent extends Action {
    async run(session: Session, inputs: { prompt: Input }, outputs: { response: Output }) {
        for await (const chunk of inputs.prompt) {
            const text = chunkText(chunk);
            const reverse = text.split("").reverse().join("");
            await outputs.response.write(textChunk(reverse, { role: ROLE.ASSISTANT }));
        }
        await outputs.response.close();
    }
}