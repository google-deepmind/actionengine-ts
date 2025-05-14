/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ActionFromSchema, ActionSchema } from './interfaces.js';
import { CachingConnectionManagerFactory } from './net.js';
/**
 * Interface for functions that generate identifiers for input and output
 * streams. Most library users can depend on the default implementation,
 * `UuidStreamIdGenerator`. For unit tests: this interface enables tests
 * to 1) verify that client-issued messages are assigned the expected stream id
 * and 2) simulate server responses on specific streams.
 */
export interface StreamIdGenerator {
    generateStreamId(streamName: string): string;
}
/**
 * Default implementation of `StreamIdGenerator` that assigns random UUIDs
 * to each stream.
 */
export declare class UuidStreamIdGenerator implements StreamIdGenerator {
    generateStreamId(streamName: string): string;
}
/**
 * Configuration options used to create a new `ActionFromSchema`. See
 * the `action` function.
 */
export declare class Options {
    readonly backend: string;
    readonly idGenerator: StreamIdGenerator;
    readonly connectionFactory: CachingConnectionManagerFactory<unknown>;
    constructor(backend?: string, idGenerator?: StreamIdGenerator, connectionFactory?: CachingConnectionManagerFactory<unknown>);
}
/** Sets the backend address wss://myapi/address?key=mykey. */
export declare function setBackend(address: string): void;
export declare function action<T extends ActionSchema>(uri: string, action: T, options?: Options): ActionFromSchema<T>;
