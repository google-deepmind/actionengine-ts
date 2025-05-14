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
    onError(event: any): void;
    /**
     * Callback that is invoked when the connection is closed. Note that
     * implementers of this interface must ensure that this callback is invoked
     * e.g. by registering an event listener on the underlying network connection.
     */
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
export declare abstract class AbstractBaseConnectionManager<T> implements ConnectionManager<T> {
    private callbacks;
    /**
     * Method defined in interface. Registers the provided `callback` in an
     * internal array of callbacks. Each callback will be invoked when a new
     * `SessionMessage` is received from the remote server.
     */
    registerSessionMessageCallback(callback: SessionMessageCallbackFn): void;
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
    abstract onError(event: any): void;
    /**
     * Method defined in interface. Implementers must override this method with
     * a concrete implementation. Refer to interface documentation for more
     * details.
     */
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
    onServerResponse(event: T): Promise<void>;
    /**
     * Converts the raw server response into a `SessionMessage` object. If the
     * response does not represent a valid `SessionMessage` then either an
     * error should be raised or `undefined` should be returned. If the response
     * is expected but simply doesn't represent a `SessionMessage`, e.g. the
     * response represents some network control metadata, then the appropriate
     * behavior is to return `undefined`. However, if the response is not
     * expected and represents an error, then an error should be raised.
     */
    protected abstract convertServerResponseToSessionMessage(event: T): Promise<eg.SessionMessage | undefined>;
}
/**
 * Function that instantiates new `WebSocketConnectionManager`s. This is
 * intended to be used as the `createManagerFn` argument to the
 * `CachingConnectionManagerFactory` constructor.
 */
export declare function WebSocketConnectionManagerFactoryFn(backendUrl: string): WebSocketConnectionManager;
/**
 * Implementation of the `ConnectionManager` interface that uses WebSockets
 * for network transport.
 */
export declare class WebSocketConnectionManager extends AbstractBaseConnectionManager<MessageEvent> {
    private readonly socket;
    private constructor();
    static createWithUrl(backendUrl: string): WebSocketConnectionManager;
    static createWithSocket(socket: WebSocket): WebSocketConnectionManager;
    isValidConnection(): boolean;
    connect(): Promise<void>;
    disconnect(): void;
    send(message: eg.SessionMessage): void;
    convertServerResponseToSessionMessage(event: MessageEvent): Promise<eg.SessionMessage | undefined>;
    onError(event: any): void;
    onClose(event: CloseEvent): void;
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
export declare class CachingConnectionManagerFactory<T> {
    private readonly connectionMap;
    private readonly createManagerFn;
    constructor(createManagerFn: (backendUrl: string) => ConnectionManager<T>);
    getConnection(session: Session, backendUrl: string): ConnectionManager<T>;
}
