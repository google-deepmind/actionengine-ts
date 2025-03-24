/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/** Generate action */
export declare const GENERATE: {
    readonly name: "GENERATE";
    readonly inputs: readonly [{
        readonly name: "prompt";
        readonly description: "The prompt to generate from";
        readonly type: readonly [{
            readonly type: "text";
            readonly subtype: "plain";
        }, {
            readonly type: "image";
            readonly subtype: "png";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "response";
        readonly description: "The response from the model";
        readonly type: readonly [{
            readonly type: "text";
            readonly subtype: "plain";
        }, {
            readonly type: "image";
            readonly subtype: "png";
        }];
    }];
};
/** Generate action type */
export type GENERATE = typeof GENERATE;
