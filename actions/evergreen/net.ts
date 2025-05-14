/**
 * @fileoverview Abstractions for the network layer required to execute
 * Evergreen actions on remote servers from a web browser client. As well as
 * a default implementation that uses WebSockets for network transport.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Session } from '../../interfaces.js';

import * as eg from './evergreen_spec.js';

/**
 * Interface for callback functions that are invoked by the
 * `ConnectionManager` when a `SessionMessage` is received from the remote
 * server.
 */
export type SessionMessageCallbackFn = (message: eg.SessionMessage) => void;

/**
 * `ConnectionManager` is the interface between Evergreen action execution
 * methods defined in `run.ts` and the network transport used to communicate
 * with the remote server. `T` is the type of response message expected from
 * the remote server.
 */
export declare interface ConnectionManager<T> {
  /**
   * Registers a `SesionMessageCallbackFn` to be invoked when a `SessionMessage`
   * is received from the remote server. If multiple callbacks are registered
   * then they will each be invoked for each `SessionMessage` received.
   */
  registerSessionMessageCallback(callback: SessionMessageCallbackFn): void;

  /**
   * Establish a connection to the remote server. This is a no-op if the
   * connection is already established.
   */
  connect(): Promise<void>;

  /**
   * End the connection to the remote server. This is a no-op if the connection
   * is already closed or was never established.
   */
  disconnect(): void;

  /**
   * Send a message to the remote server.
   */
  send(message: eg.SessionMessage): void;

  /**
   * Callback that is invoked when a response is received from the
   * remote server. Note that implementers of this interface must ensure
   * that this callback is invoked e.g. by registering an event listener
   * on the underlying network connection.
   */
  onServerResponse(message: T): Promise<void>;

  /**
   * Callback that is invoked when an error is received from the remote server.
   * Note that implementers of this interface must ensure that this callback is
   * invoked e.g. by registering an event listener on the underlying network
   * connection.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError(event: any): void;

  /**
   * Callback that is invoked when the connection is closed. Note that
   * implementers of this interface must ensure that this callback is invoked
   * e.g. by registering an event listener on the underlying network connection.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose(event: any): void;

  /**
   * Returns `true` if the connection is considered "valid" and `false`
   * otherwise. The exact semantics of valid and invalid are up to the
   * interface implementer. A connection which is invalid will be disposed
   * of and a new connection will be created to replace it.
   */
  isValidConnection(): boolean;
}

/**
 * Abstract base implementation of the `ConnectionManager` interface. This
 * base class provides a default implementation of the `onServerResponse`
 * method. The default implementation converts the raw server response into
 * a `SessionMessage` object and notifies any registered callbacks of the newly
 * available `SessionMessage`. Implementers must provide their own concrete
 * implementation of the `convertServerResponseToSessionMessage` method which
 * performs the conversion from the raw server response to a `SessionMessage`
 * object.
 */
export abstract class AbstractBaseConnectionManager<T>
  implements ConnectionManager<T> {
  private callbacks: SessionMessageCallbackFn[] = [];

  /**
   * Method defined in interface. Registers the provided `callback` in an
   * internal array of callbacks. Each callback will be invoked when a new
   * `SessionMessage` is received from the remote server.
   */
  registerSessionMessageCallback(callback: SessionMessageCallbackFn): void {
    this.callbacks.push(callback);
  }

  /**
   * Method defined in interface. Implementers must override this method with
   * a concrete implementation. Refer to interface documentation for more
   * details.
   */
  abstract connect(): Promise<void>;

  /**
   * Method defined in interface. Implementers must override this method with
   * a concrete implementation. Refer to interface documentation for more
   * details.
   */
  abstract disconnect(): void;

  /**
   * Method defined in interface. Implementers must override this method with
   * a concrete implementation. Refer to interface documentation for more
   * details.
   */
  abstract send(message: eg.SessionMessage): void;

  /**
   * Method defined in interface. Implementers must override this method with
   * a concrete implementation. Refer to interface documentation for more
   * details.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract onError(event: any): void;

  /**
   * Method defined in interface. Implementers must override this method with
   * a concrete implementation. Refer to interface documentation for more
   * details.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract onClose(event: any): void;

  /**
   * Method defined in interface. Implementers must override this method with
   * a concrete implementation. Refer to interface documentation for more
   * details.
   */
  abstract isValidConnection(): boolean;

  /**
   * Default implementation of the `onServerResponse` method. This method
   * converts the raw server response into a `SessionMessage` object and emits
   * it via the registered callbacks. Implementers must provide their
   * own concrete implementation of the `convertServerResponseToSessionMessage`
   * method below.
   */
  async onServerResponse(event: T): Promise<void> {
    const message: eg.SessionMessage | undefined =
      await this.convertServerResponseToSessionMessage(event);
    if (message) {
      for (const callback of this.callbacks) {
        callback(message);
      }
    }
  }

  /**
   * Converts the raw server response into a `SessionMessage` object. If the
   * response does not represent a valid `SessionMessage` then either an
   * error should be raised or `undefined` should be returned. If the response
   * is expected but simply doesn't represent a `SessionMessage`, e.g. the
   * response represents some network control metadata, then the appropriate
   * behavior is to return `undefined`. However, if the response is not
   * expected and represents an error, then an error should be raised.
   */
  protected abstract convertServerResponseToSessionMessage(
    event: T,
  ): Promise<eg.SessionMessage | undefined>;
}

/**
 * Function that instantiates new `WebSocketConnectionManager`s. This is
 * intended to be used as the `createManagerFn` argument to the
 * `CachingConnectionManagerFactory` constructor.
 */
export function WebSocketConnectionManagerFactoryFn(
  backendUrl: string,
): WebSocketConnectionManager {
  return WebSocketConnectionManager.createWithUrl(backendUrl);
}

/**
 * Implementation of the `ConnectionManager` interface that uses WebSockets
 * for network transport.
 */
export class WebSocketConnectionManager extends AbstractBaseConnectionManager<MessageEvent> {
  private readonly socket: WebSocket;

  private constructor(backendUrl?: string, socket?: WebSocket) {
    super();
    if (backendUrl) {
      this.socket = new WebSocket(backendUrl);
    } else if (socket) {
      this.socket = socket;
    } else {
      throw new Error('Either backendUrl or socket must be provided.');
    }
    this.socket.binaryType = 'blob';
  }

  static createWithUrl(backendUrl: string): WebSocketConnectionManager {
    return new WebSocketConnectionManager(backendUrl);
  }

  static createWithSocket(socket: WebSocket): WebSocketConnectionManager {
    return new WebSocketConnectionManager(undefined, socket);
  }

  override isValidConnection(): boolean {
    return this.socket.readyState === WebSocket.OPEN;
  }

  override async connect(): Promise<void> {
    if (this.isValidConnection()) {
      console.info('WebSocket already connected');
      return;
    }
    await new Promise<void>((resolve, reject) => {
      this.socket.addEventListener('open', () => {
        this.socket.removeEventListener('error', reject);
        this.socket.removeEventListener('close', reject);
        resolve();
      });
      this.socket.addEventListener('error', reject);
      this.socket.addEventListener('close', reject);
    });
    this.socket.onmessage = async (event: MessageEvent) => {
      await this.onServerResponse(event);
    };
    this.socket.onerror = (event: Event) => {
      this.onError(event);
    };
    this.socket.onclose = (event: CloseEvent) => {
      this.onClose(event);
    };
  }

  override disconnect(): void {
    // TODO(geoffdowns): not in original implementation. Remove? Retain?
    this.socket.close();
  }

  override send(message: eg.SessionMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  override async convertServerResponseToSessionMessage(
    event: MessageEvent,
  ): Promise<eg.SessionMessage | undefined> {
    let message: eg.SessionMessage;
    switch (event.type) {
      case 'text':
      case 'message':
      case 'binary':
        const data = event.data as unknown;
        if (data instanceof Blob) {
          const buf = await data.arrayBuffer();
          message = JSON.parse(
            new TextDecoder().decode(new Uint8Array(buf)),
          ) as eg.SessionMessage;
        } else if (data instanceof ArrayBuffer) {
          message = JSON.parse(
            new TextDecoder().decode(new Uint8Array(data)),
          ) as eg.SessionMessage;
        } else if (typeof data === 'string') {
          message = JSON.parse(data) as eg.SessionMessage;
        } else {
          throw new Error(
            `Unsupported type ${this.socket.binaryType} ${typeof data}`,
          );
        }
        break;
      default:
        throw new Error(`Unknown message type ${event.type}`);
    }
    return message;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  override onError(event: any) {
    console.info('Websocket error', event, this.socket);
  }

  override onClose(event: CloseEvent) {
    // See
    // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code#value
    // for mapping from code to explanation.
    console.info(
      `Websocket closed: ${event.reason} ${event.code}`,
      event,
      this.socket,
    );
  }
}

/**
 * Factory for creating `ConnectionManager`s. This factory caches
 * `ConnectionManager`s for a given `Session`. Previously cached
 * `ConnectionManager`s are only returned if they are considered "valid".
 * Implementers of the `ConnectionManager` interface must define what it means
 * for a connection to be valid or invalid. Typically this will be based on
 * the state of the underlying network connection, e.g. a `WebSocket` in the
 * `WebSocket.OPEN` state would be considered valid and all other states would
 * be considered invalid.
 */
export class CachingConnectionManagerFactory<T> {
  private readonly connectionMap = new Map<Session, ConnectionManager<T>>();
  private readonly createManagerFn: (
    backendUrl: string,
  ) => ConnectionManager<T>;

  constructor(createManagerFn: (backendUrl: string) => ConnectionManager<T>) {
    this.createManagerFn = createManagerFn;
  }

  getConnection(session: Session, backendUrl: string): ConnectionManager<T> {
    let manager = this.connectionMap.get(session);
    if (manager) {
      if (manager.isValidConnection()) {
        return manager;
      } else {
        manager = undefined;
        this.connectionMap.delete(session);
      }
    }

    manager = this.createManagerFn(backendUrl);
    this.connectionMap.set(session, manager);
    return manager;
  }
}
