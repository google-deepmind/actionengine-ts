/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from '../../index.js';
import {maybeAuthenticate} from '../../actions/drive/auth.js';
import {docToText} from '../../actions/drive/drive.js';

maybeAuthenticate();

const outputArea = document.querySelector('#output');
document.querySelector('#submitButton').addEventListener('click', async () => {
  const session = aiae.sessions.local(aiae.sessions.middleware.debug);
  const docUrl = session.createPipe();
  const docUrlValue = (document.querySelector('#docUrl') as HTMLInputElement).value;
  void docUrl.write(aiae.content.textChunk(docUrlValue));
  docUrl.close();
  const inputs = { docUrl };
  const outputs = session.run(docToText, inputs, ['docText']);
  for await (const chunk of outputs.docText) {
    outputArea.innerHTML += aiae.content.chunkText(chunk);
  }
});
