/**
 * @fileoverview Test utilities for this package.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {SessionMessage} from './evergreen_spec.js';

/**
 * A fake implementation of the `WebSocket` class for testing purposes.
 */
export class FakeWebSocket {
  // Unused but required by the interface.
  url = '';

  // Record of all the payloads provided to invocations of the `send` method.
  sentMessages: string[] = [];

  // Set `responses` if you want to simulate one or more responses from the
  // server. The response will only be sent once the `send` method is invoked
  // with a "close message". A close message is one where the only
  // "nodeFragment" has `continued` set to false.
  // If no response is set, then any invocation of `send` will result in
  // the `onerror` handler being called instead.
  responses: MessageEvent[] = [];

  private isCloseMessage(message: string): boolean {
    const parsedMsg = JSON.parse(message) as SessionMessage;
    return (
      parsedMsg.nodeFragments?.length === 1 &&
      !parsedMsg.nodeFragments[0].continued
    );
  }

  onopen: ((event: Event) => void) | null = null;

  onclose(event: CloseEvent) {}

  onerror(event: Event) {}

  onmessage(event: MessageEvent): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Promise that resolves when any and all async methods invoked as a
   * result of calling the `send` method have completed. In this fake
   * implementation, we use the special "close" SessionMessage as a signal
   * that all server responses registered via `responses` should be sent.
   * Handling server responses is an async operation. So waiting on this
   * promise enables tests to wait until all server responses have been
   * handled before proceeding.
   */
  onMessageCompletePromise: Promise<void> | null = null;

  send(data: any) {
    this.sentMessages.push(data as string);
    if (this.isCloseMessage(data as string)) {
      // 'Send' isn't async but we have overridden the behavior so that a
      // close message triggers a simulated "response" from the server. The
      // server response is simulated by calling the onmessage handler. And
      // the onmessage handler is async. We expose the promise that results
      // from the onmessage function call so that tests can wait for the
      // response to be handled before proceeding.
      const promises: Array<Promise<void>> = [];
      for (const response of this.responses) {
        promises.push(this.onmessage(response));
      }
      this.onMessageCompletePromise = Promise.all(promises).then(() => {});
    }
  }

  close() {
    this.onclose({} as CloseEvent);
  }

  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void {
    switch (type) {
      case 'open':
        this.onopen = listener as (this: WebSocket, ev: Event) => any;
        break;
      case 'close':
        this.onclose = listener as (this: WebSocket, ev: CloseEvent) => any;
        break;
      case 'error':
        this.onerror = listener as (this: WebSocket, ev: Event) => any;
        break;
      case 'message':
        this.onmessage = listener as (this: WebSocket, ev: MessageEvent) => any;
        break;
      default:
        break;
    }
  }
  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void {
    switch (type) {
      case 'open':
        this.onopen = null;
        break;
      case 'close':
        this.onclose = (event: CloseEvent) => {};
        break;
      case 'error':
        this.onerror = (event: Event) => {};
        break;
      case 'message':
        this.onmessage = (event: MessageEvent): Promise<void> => {
          return Promise.resolve();
        };
        break;
      default:
        break;
    }
  }
  dispatchEvent<K extends keyof WebSocketEventMap>(
    event: WebSocketEventMap[K] & {type: K},
  ): boolean {
    switch (event.type) {
      case 'open':
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.call(this, event);
        break;
      case 'close':
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose.call(this, event as CloseEvent);
        break;
      case 'error':
        this.readyState = FakeWebSocket.CLOSED;
        this.onerror.call(this, event);
        break;
      case 'message':
        this.onmessage.call(this, event as MessageEvent);
        break;
      default:
        break;
    }
    return true;
  }

  // Required by the interface but has no effect in this fake implementation.
  constructor(url: string | URL, protocols?: string | string[] | undefined) {}

  binaryType: BinaryType = 'blob';

  static readonly CONNECTING: typeof WebSocket.CONNECTING = 0;
  static readonly OPEN: typeof WebSocket.OPEN = 1;
  static readonly CLOSING: typeof WebSocket.CLOSING = 2;
  static readonly CLOSED: typeof WebSocket.CLOSED = 3;
  CONNECTING: typeof WebSocket.CONNECTING = 0;
  OPEN: typeof WebSocket.OPEN = 1;
  CLOSING: typeof WebSocket.CLOSING = 2;
  CLOSED: typeof WebSocket.CLOSED = 3;
  readyState = 0;
  bufferedAmount = 0;
  extensions = '';
  protocol = '';
}
