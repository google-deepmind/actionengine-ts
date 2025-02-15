/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import 'jasmine';
import { Chunk } from '../interfaces.js';
/** Ignore fields when comparing objects. */
export declare function ignoreFields(...fields: string[]): (a: unknown, b: unknown) => boolean;
declare global {
    namespace jasmine {
        interface Matchers<T> {
            toEqualChunk(expected: Chunk): void;
            toEqualChunks(expected: Chunk[]): void;
        }
    }
}
/** Matcher to compare chunks without volatile fields. */
export declare const matchers: jasmine.CustomMatcherFactories;
