/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from '../../index.js';
import {maybeAuthenticate} from './auth.js';
import {documentToText, fetchDocument} from './drive_lib.js';

const docToText: aiae.Processor<'docUrl', 'docText'> =
    async function*(chunks) {

  for await (const [k, c] of chunks) {
    if (k === 'docUrl') {
      const document = await fetchDocument(aiae.content.chunkText(c));
      const documentText = documentToText(document);
      yield ['docText', aiae.content.textChunk(documentText)];
    }
  }
}

maybeAuthenticate();

const outputArea = document.querySelector('#output');
document.querySelector('#submitButton').addEventListener('click', async(e) => {
  const session = aiae.sessions.local(aiae.sessions.middleware.debug);
  const userPrompt = session.createPipe();
  const docUrl = (document.querySelector('#docUrl') as HTMLInputElement).value;
  void userPrompt.write(aiae.content.textChunk(docUrl));
  userPrompt.close();
  const inputs = { docUrl: userPrompt };
  const outputs = session.run(docToText, inputs, ['docText']);
  for await (const chunk of outputs.docText) {
    outputArea.innerHTML += aiae.content.chunkText(chunk);
  }
});
