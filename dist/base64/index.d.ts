/**
 * @fileoverview base64 helper utilities.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/** Encodes Uint8Array to base64 string. */
export declare function encode(bytes: Uint8Array): string;
/** Decodes base64 string to Uint8Array. */
export declare function decode(base64: string): Uint8Array;
