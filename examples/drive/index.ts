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
// eslint-disable-next-line @typescript-eslint/no-misused-promises
document.querySelector('#submitButton')?.addEventListener('click', async () => {
  const session = aiae.sessions.local(aiae.sessions.middleware.debug);
  const docUrl = session.createPipe();
  const docUrlInput: HTMLInputElement|null = document.querySelector('#docUrl');
  const docUrlValue = docUrlInput?.value ?? '';
  await docUrl.writeAndClose(aiae.content.textChunk(docUrlValue));
  const inputs = { docUrl };
  const outputs = session.run(aiae.actions.drive.docToText, inputs, ['docText']);
  for await (const chunk of outputs.docText) {
    outputArea.innerHTML += aiae.content.chunkText(chunk);
  }
});
