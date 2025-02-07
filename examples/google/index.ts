/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from '../../index.js';

async function main() {
    const session = aiae.sessions.local();

    const API_KEY = prompt('API KEY');
    const flashGenerate = new aiae.actions.google.GoogleGenerateContent(API_KEY, "gemini-1.5-flash");
    const inputPrompt = session.createPipe();
    inputPrompt.writeAndClose(aiae.content.prompt`Hello there`)
    const outputs = session.run(flashGenerate, {'prompt': inputPrompt}, ['response']);

    for await (const chunk of outputs.response) {
        console.log("FROM GENAI", aiae.content.chunkText(chunk));
    }

}

main();
