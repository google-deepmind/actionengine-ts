/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {ActionSchema} from './interfaces.js';

/** Generate action */
export const GENERATE = {
  name: 'GENERATE',
  inputs: [
    {
      name: 'prompt',
      description: 'The prompt to generate from',
      type: [
        {type: 'text', subtype: 'plain'},
        {type: 'image', subtype: 'png'},
      ],
    },
  ],
  outputs: [
    {
      name: 'response',
      description: 'The response from the model',
      type: [
        {type: 'text', subtype: 'plain'},
        {type: 'image', subtype: 'png'},
      ],
    },
  ],
} as const satisfies ActionSchema;

/** Generate action type */
export type GENERATE = typeof GENERATE;