/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Input, Output, Action, Session } from '../interfaces.js';
import { type AudioChunk, type ImageChunk } from '../content/content.js';
/** Well defined GenerateContent Action */
export declare abstract class GenerateContent extends Action {
    abstract run(session: Session, inputs: {
        prompt: Input;
    }, outputs: {
        response?: Output;
    }): Promise<void>;
}
/** Well defined Live Action */
export declare abstract class Live extends Action {
    abstract run(session: Session, inputs: {
        audio?: Input<AudioChunk>;
        video?: Input<ImageChunk>;
        screen?: Input<ImageChunk>;
        context?: Input;
        system?: Input;
    }, outputs: {
        audio?: Output<AudioChunk>;
        context?: Output;
    }): Promise<void>;
}
