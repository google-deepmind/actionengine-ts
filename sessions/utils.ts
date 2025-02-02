/**
 * @fileoverview Internal methods for the SDK.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let uniqueIdCounter = 1;

/**
 * Test ony method to reset the unique id counter.
 */
export function _resetUniqueId() {
  uniqueIdCounter = 1;
}

/**
 * Generates a unique id.
 */
export function uniqueId() {
  return `${uniqueIdCounter++}`;
}
