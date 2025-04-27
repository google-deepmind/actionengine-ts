import 'jasmine';

import {encode as b64encode} from '../../base64/index.js';
//import * as content from '../../content/index.js';
import * as eg from './evergreen_spec.js';
import {WebSocketConnectionManager} from './net.js';
import {FakeWebSocket} from './test_utils.js';

class TestSessionMessageCallback {
  capturedSessionMessages: eg.SessionMessage[] = [];

  callback(message: eg.SessionMessage): void {
    this.capturedSessionMessages.push(message);
  }
}

describe('WebSocketConnectionManager Test', () => {
  let fakeWebSocket: FakeWebSocket;
  let testCallback: TestSessionMessageCallback;
  let impl: WebSocketConnectionManager;
  const closeMsg: eg.SessionMessage = {
    nodeFragments: [
      {
        id: 'close',
        seq: 0,
        continued: false,
      },
    ],
  };

  beforeEach(() => {
    // We need to define WebSocket in the global scope because the
    // test environment, unlike a browser runtime environment, does not
    // define this class.
    globalThis.WebSocket = FakeWebSocket;
    fakeWebSocket = new FakeWebSocket('wss://test');
    impl = WebSocketConnectionManager.createWithSocket(fakeWebSocket);

    // register a callback to capture any session messages received
    testCallback = new TestSessionMessageCallback();
    impl.registerSessionMessageCallback((message: eg.SessionMessage) => {
      testCallback.callback(message);
    });
  });

  it('Error during connect', async () => {
    const p = impl.connect();
    // trigger an error event on the fake web socket
    const errorEvent = new Event('error') as WebSocketEventMap['error'] & {
      type: 'error';
    };
    fakeWebSocket.dispatchEvent(errorEvent);
    await expectAsync(p).toBeRejected();
  });

  it('Socket closed during connect', async () => {
    const p = impl.connect();
    // trigger a close event on the fake web socket
    const closeEvent = new Event('close') as WebSocketEventMap['close'] & {
      type: 'close';
    };
    fakeWebSocket.dispatchEvent(closeEvent);
    await expectAsync(p).toBeRejected();
  });

  it('Successful connection', async () => {
    const p = impl.connect();
    // trigger a open event on the fake web socket
    const openEvent = new Event('open') as WebSocketEventMap['open'] & {
      type: 'open';
    };
    fakeWebSocket.dispatchEvent(openEvent);
    await expectAsync(p).toBeResolved();

    // expect the 'isValidConnection' method to return true
    expect(impl.isValidConnection()).toBeTrue();
  });

  it('Send method passes expected payload to socket', async () => {
    // Connect the websocket
    const p = impl.connect();
    const openEvent = new Event('open') as WebSocketEventMap['open'] & {
      type: 'open';
    };
    fakeWebSocket.dispatchEvent(openEvent);
    await expectAsync(p).toBeResolved();

    // Send a SessionMessage
    const sessionMessage: eg.SessionMessage = {
      nodeFragments: [
        {
          id: 'test',
          seq: 0,
          continued: false,
          chunkFragment: {
            metadata: {
              mimetype: 'text/plain',
              role: 'user',
            },
            data: b64encode(new TextEncoder().encode('this is a test')),
          },
        },
      ],
    };
    impl.send(sessionMessage);

    // Expect the fake websocket 'send' method to have been invoked with the
    // SessionMessage as json serialized string.
    expect(fakeWebSocket.sentMessages).toEqual(
      jasmine.arrayWithExactContents([JSON.stringify(sessionMessage)]),
    );
  });

  interface ValidServerResponseTestCase {
    description: string;
    eventType: string;
    transform: (message: eg.SessionMessage) => any;
  }

  const testCases: ValidServerResponseTestCase[] = [
    {
      description: 'when provided as string',
      eventType: 'text',
      transform: JSON.stringify,
    },
    {
      description: 'when provided as ArrayBuffer',
      eventType: 'text',
      transform: (message: eg.SessionMessage) => {
        const encodedArray = new TextEncoder().encode(JSON.stringify(message));
        return encodedArray.buffer.slice(
          encodedArray.byteOffset,
          encodedArray.byteOffset + encodedArray.byteLength,
        );
      },
    },
    {
      description: 'when provided as Blob',
      eventType: 'binary',
      transform: (message: eg.SessionMessage) => {
        const encodedArray = new TextEncoder().encode(JSON.stringify(message));
        return new Blob([encodedArray], {
          type: 'application/octet-stream',
        });
      },
    },
  ];

  // Execute each of the test cases defined above. The setup and expectations
  // for these tests are identical, so we use a parameterized test to avoid
  // copy/paste. The difference between these test cases is the specific
  // format of the MessageEvent.data field in our simulated server response.
  testCases.forEach(({description, eventType, transform}) => {
    it(`Correctly parses server response ${description}`, async () => {
      // Connect the websocket
      const p = impl.connect();
      const openEvent = new Event('open') as WebSocketEventMap['open'] & {
        type: 'open';
      };
      fakeWebSocket.dispatchEvent(openEvent);
      await expectAsync(p).toBeResolved();

      // configure the fake websocket to invoke the onmessage handler with
      // a MessageEvent that contains a SessionMessage as a JSON string.
      const sessionMessage: eg.SessionMessage = {
        nodeFragments: [
          {
            id: 'test',
            seq: 0,
            continued: false,
            chunkFragment: {
              metadata: {
                mimetype: 'text/plain',
                role: 'model',
              },
              data: b64encode(new TextEncoder().encode('this is a test')),
            },
          },
        ],
      };
      const serverResponse = new MessageEvent(eventType, {
        data: transform(sessionMessage),
      });
      fakeWebSocket.responses.push(serverResponse);

      // Send a close message to the websocket to trigger the server response
      // being sent.
      impl.send(closeMsg);

      // Wait for the onMessageCompletePromise to resolve.
      await fakeWebSocket.onMessageCompletePromise;

      // verify the callback was invoked with the expected SessionMessage
      expect(testCallback.capturedSessionMessages).toEqual(
        jasmine.arrayWithExactContents([sessionMessage]),
      );
    });
  });

  it('Raises error when data in server response is not a supported type', async () => {
    // Connect the websocket
    const p = impl.connect();
    const openEvent = new Event('open') as WebSocketEventMap['open'] & {
      type: 'open';
    };
    fakeWebSocket.dispatchEvent(openEvent);
    await expectAsync(p).toBeResolved();

    // send a server response with a data field that is not a supported type
    const sessionMessage: eg.SessionMessage = {
      nodeFragments: [
        {
          id: 'test',
          seq: 0,
          continued: false,
          chunkFragment: {
            metadata: {
              mimetype: 'text/plain',
              role: 'model',
            },
            data: b64encode(new TextEncoder().encode('this is a test')),
          },
        },
      ],
    };
    const serverResponse = new MessageEvent('other', {
      data: JSON.stringify(sessionMessage),
    });
    fakeWebSocket.responses.push(serverResponse);

    // Send a close message to the websocket to trigger the server response
    // being sent.
    impl.send(closeMsg);
    await expectAsync(
      fakeWebSocket.onMessageCompletePromise,
    ).toBeRejectedWithError();
  });

  it('Raises error when server response is not a supported event type', async () => {
    // Connect the websocket
    const p = impl.connect();
    const openEvent = new Event('open') as WebSocketEventMap['open'] & {
      type: 'open';
    };
    fakeWebSocket.dispatchEvent(openEvent);
    await expectAsync(p).toBeResolved();

    // send a server response with a valid data field but an unsupported
    // event type
    const serverResponse = new MessageEvent('other', {
      data: [1, 2, 3],
    });
    fakeWebSocket.responses.push(serverResponse);

    // Send a close message to the websocket to trigger the server response
    // being sent.
    impl.send(closeMsg);
    await expectAsync(
      fakeWebSocket.onMessageCompletePromise,
    ).toBeRejectedWithError();
  });
});
