/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Input, Output, Action, Session } from '../interfaces.js';
/** Reverse some content. */
export declare class ReverseContent extends Action {
    run(session: Session, inputs: {
        prompt: Input;
    }, outputs: {
        response: Output;
    }): Promise<void>;
}
