/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ActionFromSchema, ActionSchema } from './interfaces.js';
import { CachingConnectionManagerFactory } from './net.js';
export interface StreamIdGenerator {
    generateStreamId(streamName: string): string;
}
export declare class Options {
    readonly backend: string;
    readonly idGenerator: StreamIdGenerator;
    readonly connectionFactory: CachingConnectionManagerFactory<unknown>;
    constructor(backend: string, idGenerator: StreamIdGenerator, connectionFactory: CachingConnectionManagerFactory<unknown>);
}
/** Sets the backend address wss://myapi/address?key=mykey. */
export declare function setBackend(address: string): void;
export declare function action<T extends ActionSchema>(uri: string, action: T, options?: Options): ActionFromSchema<T>;
