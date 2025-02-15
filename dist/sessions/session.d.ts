/**
 * @fileoverview Internal methods for the SDK.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { SessionContext, SessionProvider } from '../interfaces.js';
/** Provides a session. */
export declare function sessionProvider(contextProvider: () => SessionContext): SessionProvider;
