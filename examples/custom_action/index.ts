/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from '../../index.js';

// Example custom action
class EchoAction extends aiae.Action {
  async run(session: aiae.Session, inputs: { prompt: aiae.Input }, outputs: {
    response: aiae.Output
  }) {
    // Simple pipe pass through.
    for await (const chunk of inputs.prompt) {
      outputs.response.write(chunk);
    }
    outputs.response.close();
  }
}


const echoProcessor: aiae.Processor<'prompt', 'response'> =
    async function*(chunks) {
  for await (const [k, c] of chunks) {
    if (k === 'prompt') {
      yield ['response', c];
    }
  }
}

async function main() {
  const echo = new EchoAction();
  const reverse = new aiae.actions.ReverseContent();

  const session = aiae.sessions.local(aiae.sessions.middleware.debug);
  const userPrompt = session.createPipe();
  void userPrompt.write(aiae.content.textChunk('Hello!'));
  userPrompt.close();

  const inputs = { prompt: userPrompt };

  const outputs = session.run(echo, inputs, ['response']);

  for await (const chunk of outputs.response) {
    console.log(aiae.content.chunkText(chunk));
  }

  const outs = session.run(reverse, inputs, ['response']);
  const outs2 = session.run(echoProcessor, inputs, ['response']);
  const chunks = aiae.async.merge(outs.response, outs2.response);

  for await (const chunk of chunks) {
    console.log(aiae.content.chunkText(chunk));
  }

}

main();
