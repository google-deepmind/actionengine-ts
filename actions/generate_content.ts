/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Input, Output, Action, Session} from '../interfaces.js';

/** Well defined GenerateContent Action */
export abstract class GenerateContent extends Action {
    abstract run(session: Session, inputs: {prompt: Input}, outputs: {response: Output}): Promise<void>;
}
