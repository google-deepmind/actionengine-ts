/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { ActionFromSchema, ActionSchema } from './interfaces.js';
/** Sets the backend address wss://myapi/adddress?key=mykey. */
export declare function setBackend(address: string): void;
export declare function action<T extends ActionSchema>(uri: string, action: T): ActionFromSchema<T>;
