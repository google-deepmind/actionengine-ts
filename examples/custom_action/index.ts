/**
 * @fileoverview Example.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as aiae from '../../index.js';

// Example custom action
class EchoAction extends aiae.Action {
  async run(session: aiae.Session, inputs: {prompt: aiae.Input}, outputs: {
    response: aiae.Output
  }) {
    // Simple pipe pass through.
    for await (const chunk of inputs.prompt) {
      outputs.response.write(chunk);
    }
    outputs.response.close();
  }
}

async function main() {
  const session = aiae.sessions.fake();
  const userPrompt = session.placeholder();
  void userPrompt.write(aiae.content.textChunk('Hello!'));
  userPrompt.close();

  const inputs = {prompt: userPrompt};
  const outputs = {response: session.placeholder()};

  void session.run(EchoAction, inputs, outputs);

  for await (const chunk of outputs.response) {
    console.log(aiae.content.chunkText(chunk));
  }

  const outs = {response: session.placeholder()};
  void session.run(aiae.actions.GenerateContent, inputs, outs);
  void session.run(aiae.actions.ReverseContent, inputs, outs);

  for await (const chunk of outs.response) {
    console.log(aiae.content.chunkText(chunk));
  }
}

main();
