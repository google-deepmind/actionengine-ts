/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import { Chunk } from '../interfaces.js';

/** Ignore fields when comparing objects. */
export function ignoreFields(...fields: string[]) {
    const equality = (a: unknown, b: unknown): boolean => {
        if (
            typeof a !== 'object' ||
            typeof b !== 'object' ||
            a === null ||
            b === null
        ) {
            // Base case: simple values or nulls, just compare directly
            return a === b;
        }
        if (Object.keys(a).length !== Object.keys(b).length) {
            return false;
        }
        // Recursive case: objects
        return Object.keys(a).every((key) => {
            if (fields.includes(key)) {
                // Ignore fields
                return true;
            } else {
                // Recursively compare other properties
                return equality(
                    (a as { [key: string]: unknown })[key],
                    (b as { [key: string]: unknown })[key],
                );
            }
        });
    };
    return equality;
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jasmine {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        interface Matchers<T> {
            toEqualChunk(expected: Chunk): void;
            toEqualChunks(expected: Chunk[]): void;
        }
    }
}

/** Matcher to compare chunks without volatile fields. */
export const matchers: jasmine.CustomMatcherFactories = {
    toEqualChunk(util: jasmine.MatchersUtil) {
        return {
            compare(actual: Chunk, expected: Chunk) {
                const expectedClean = cleanChunk(expected);
                const actualClean = cleanChunk(actual);
                return {
                    pass: util.equals(actualClean, expectedClean),
                    message: util.buildFailureMessage(
                        'toEqualChunk',
                        false,
                        actualClean,
                        expectedClean,
                    ),
                };
            },
        };
    },

    toEqualChunks(util: jasmine.MatchersUtil) {
        return {
            compare(actual: Chunk[], expected: Chunk[]) {
                const actualClean = actual.map((c) => cleanChunk(c));
                const expectedClean = expected.map((c) => cleanChunk(c));
                return {
                    pass: util.equals(actualClean, expectedClean),
                    message: util.buildFailureMessage(
                        'toEqualChunks',
                        false,
                        actualClean,
                        expectedClean,
                    ),
                };
            },
        };
    },


};

function cleanChunk(chunk?: Chunk) {
    if (!chunk) {
        return;
    }
    return {
        ...chunk,
        metadata: {
            ...chunk.metadata,
            // Ignore capture time for comparisons.
            captureTime: 0,
        },
    };
}
