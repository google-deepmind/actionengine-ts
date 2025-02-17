/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from 'aiae';

function apiKey(): string {
    const STORAGE_KEY = 'GENAI_API_KEY';
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
        key = prompt('API KEY') ?? '';
        if (key) {
            localStorage.setItem(STORAGE_KEY, key);
        }
    }
    return key;
}

function main() {
    const API_KEY = apiKey();
    const flashGenerate = new aiae.actions.google.genai.GenerateContent(API_KEY, "gemini-1.5-flash");

    const session = aiae.sessions.local();

    const inputEl = document.createElement('input');
    document.body.appendChild(inputEl);
    const outputEl = document.createElement('div');
    document.body.appendChild(outputEl);


    inputEl.onchange = async () => {
        const inputText = inputEl.value || '';

        const userEl = document.createElement('div');
        outputEl.appendChild(userEl);
        userEl.innerText += `user: ${inputText}`;
        const modelEl = document.createElement('div');
        outputEl.appendChild(modelEl);
        modelEl.innerText += 'gemini: ';

        const inputPrompt = session.createPipe();
        await inputPrompt.writeAndClose(aiae.content.prompt`${inputText}`);
        const outputs = session.run(flashGenerate, {'prompt': inputPrompt}, ['response']);

        for await (const chunk of outputs.response) {
            modelEl.innerText += aiae.content.chunkText(chunk);
        }
    }

    inputEl.value = "Hello, can you explain why the sky is blue?";
    inputEl.dispatchEvent(new Event('change'));
}

main();
