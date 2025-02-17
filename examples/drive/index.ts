/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from 'aiae';

const outputArea = document.querySelector('#output');
if (!outputArea) {
  throw new Error("No output area");
}
document.querySelector('#submitButton')?.addEventListener('click', async () => {
  const session = aiae.sessions.local(aiae.sessions.middleware.debug);
  const docUrl = session.createPipe();
  const docUrlValue = (document.querySelector('#docUrl') as HTMLInputElement).value;
  void docUrl.write(aiae.content.textChunk(docUrlValue));
  docUrl.close();
  const inputs = { docUrl };
  const outputs = session.run(aiae.actions.drive.docToText, inputs, ['docText']);
  for await (const chunk of outputs.docText) {
    outputArea.innerHTML += aiae.content.chunkText(chunk);
  }
});
