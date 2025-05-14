/**
 * @fileoverview Test utilities for this package.
 */
/**
 * A fake implementation of the `WebSocket` class for testing purposes.
 */
export declare class FakeWebSocket {
    url: string;
    sentMessages: string[];
    responses: MessageEvent[];
    private isCloseMessage;
    onopen: ((event: Event) => void) | null;
    onclose(event: CloseEvent): void;
    onerror(event: Event): void;
    onmessage(event: MessageEvent): Promise<void>;
    /**
     * Promise that resolves when any and all async methods invoked as a
     * result of calling the `send` method have completed. In this fake
     * implementation, we use the special "close" SessionMessage as a signal
     * that all server responses registered via `responses` should be sent.
     * Handling server responses is an async operation. So waiting on this
     * promise enables tests to wait until all server responses have been
     * handled before proceeding.
     */
    onMessageCompletePromise: Promise<void> | null;
    send(data: any): void;
    close(): void;
    addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    dispatchEvent<K extends keyof WebSocketEventMap>(event: WebSocketEventMap[K] & {
        type: K;
    }): boolean;
    constructor(url: string | URL, protocols?: string | string[]);
    binaryType: BinaryType;
    static readonly CONNECTING: typeof WebSocket.CONNECTING;
    static readonly OPEN: typeof WebSocket.OPEN;
    static readonly CLOSING: typeof WebSocket.CLOSING;
    static readonly CLOSED: typeof WebSocket.CLOSED;
    CONNECTING: typeof WebSocket.CONNECTING;
    OPEN: typeof WebSocket.OPEN;
    CLOSING: typeof WebSocket.CLOSING;
    CLOSED: typeof WebSocket.CLOSED;
    readyState: number;
    bufferedAmount: number;
    extensions: string;
    protocol: string;
}
