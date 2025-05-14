/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { encode as b64encode } from '../../base64/index.js';
import * as content from '../../content/index.js';
import { Session } from '../../interfaces.js';
import { local } from '../../sessions/local.js';
import { ActionSchema } from './interfaces.js';
import {
  CachingConnectionManagerFactory,
  WebSocketConnectionManager,
} from './net.js';
import { action, Options, StreamIdGenerator } from './run.js';
import { FakeWebSocket } from './test_utils.js';

import 'jasmine';

class SimpleTestAction implements ActionSchema {
  name = 'simple_test_action';
  inputs = [
    {
      name: 'prompt',
      description: 'the prompt',
      type: [{ type: 'text', subtype: 'plain' }],
    },
  ];
  outputs = [
    {
      name: 'result',
      description: 'the result',
      type: [{ type: 'text', subtype: 'plain' }],
    },
  ];
}

class FakeStreamIdGenerator implements StreamIdGenerator {
  generateStreamId(streamName: string): string {
    return streamName;
  }
}

describe('EvergreenAction', () => {
  let session: Session;
  let fakeWebSocket: FakeWebSocket;
  let connManagerFactory: CachingConnectionManagerFactory<MessageEvent>;
  let options: Options;

  beforeEach(() => {
    // We need to define WebSocket in the global scope because the
    // test environment, unlike a browser runtime environment, does not
    // define this class.
    globalThis.WebSocket = FakeWebSocket;

    session = local();
    fakeWebSocket = new FakeWebSocket('wss://test');
    connManagerFactory = new CachingConnectionManagerFactory(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (backendUrl: string) => {
        return WebSocketConnectionManager.createWithSocket(fakeWebSocket);
      },
    );
    options = new Options(
      'evergreen://localhost',
      new FakeStreamIdGenerator(),
      connManagerFactory,
    );
  });

  it('run handles error from remote server on sendAction', async () => {
    // create the EvergreenAction object
    const impl = action(
      'evergreen://localhost',
      new SimpleTestAction(),
      options,
    );

    // call run, don't await
    const userPrompt = session.createPipe();
    void userPrompt.writeAndClose(content.prompt`test prompt`);
    const inputs = { prompt: userPrompt };
    const outputs = { result: session.createPipe() };
    void impl.run(session, inputs, outputs);

    // simulate a successful websocket connection
    const openEvent = new Event('open') as WebSocketEventMap['open'] & {
      type: 'open';
    };
    fakeWebSocket.dispatchEvent<'open'>(openEvent);

    // trying to read the output should not return any value
    const asyncIterator = outputs.result[Symbol.asyncIterator]();
    const resultCheck = await Promise.race([
      asyncIterator.next(),
      new Promise<boolean>((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 100);
      }),
    ]);
    expect(resultCheck).toBeTrue();

    // verify the `send` message was invoked. Note that, even though we only
    // called 'run' once and only provided a single input, the websocket
    // `send` method is typically invoked multiple times.
    expect(fakeWebSocket.sentMessages.length).toBeGreaterThan(0);
  });

  it('successful response populates the output stream', async () => {
    // set the expected response
    const event = new MessageEvent('text', {
      data: JSON.stringify({
        nodeFragments: [
          {
            id: 'result',
            seq: 0,
            continued: false,
            chunkFragment: {
              metadata: {
                mimetype: 'text/plain',
                role: 'model',
              },
              data: b64encode(new TextEncoder().encode('test response')),
            },
          },
        ],
      }),
    });
    fakeWebSocket.responses.push(event);

    // create the EvergreenAction object
    const impl = action(
      'evergreen://localhost',
      new SimpleTestAction(),
      options,
    );

    // call run but don't await
    const userPrompt = session.createPipe();
    void userPrompt.writeAndClose(content.prompt`test prompt`);
    const inputs = { prompt: userPrompt };
    const outputs = { result: session.createPipe() };
    void impl.run(session, inputs, outputs);

    // simulate a successful websocket connection
    const openEvent = new Event('open') as WebSocketEventMap['open'] & {
      type: 'open';
    };
    fakeWebSocket.dispatchEvent<'open'>(openEvent);

    // get the response from the output stream
    const asyncIterator = outputs.result[Symbol.asyncIterator]();
    const result = await asyncIterator.next();
    expect(content.isTextChunk(result.value)).toBeTrue();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(content.chunkText(result.value)).toEqual('test response');
  });

  it('handles response with content in child node', async () => {
    // set the expected responses
    const parentEvent = new MessageEvent('text', {
      data: JSON.stringify({
        nodeFragments: [
          {
            id: 'result',
            seq: 0,
            continued: true,
            childIds: ['child'],
          },
        ],
      }),
    });
    const childEvent = new MessageEvent('text', {
      data: JSON.stringify({
        nodeFragments: [
          {
            id: 'child',
            seq: 0,
            continued: false,
            chunkFragment: {
              metadata: {
                mimetype: 'text/plain',
                role: 'model',
              },
              data: b64encode(new TextEncoder().encode('test response')),
            },
          },
        ],
      }),
    });
    const finalEvent = new MessageEvent('text', {
      data: JSON.stringify({
        nodeFragments: [
          {
            id: 'result',
            seq: 1,
            continued: false,
          },
        ],
      }),
    });
    fakeWebSocket.responses = [parentEvent, childEvent, finalEvent];

    // create the EvergreenAction object
    const impl = action(
      'evergreen://localhost',
      new SimpleTestAction(),
      options,
    );

    // call run but don't await
    const userPrompt = session.createPipe();
    void userPrompt.writeAndClose(content.prompt`test prompt`);
    const inputs = { prompt: userPrompt };
    const outputs = { result: session.createPipe() };
    void impl.run(session, inputs, outputs);

    // simulate a successful websocket connection
    const openEvent = new Event('open') as WebSocketEventMap['open'] & {
      type: 'open';
    };
    fakeWebSocket.dispatchEvent<'open'>(openEvent);

    // get the response from the output stream
    const asyncIterator = outputs.result[Symbol.asyncIterator]();
    const result = await asyncIterator.next();
    expect(content.isTextChunk(result.value)).toBeTrue();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(content.chunkText(result.value)).toEqual('test response');
  });
});
