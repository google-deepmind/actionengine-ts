/**
 * @fileoverview Evergreen interfaces.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Action, Input, Mimetype, Output} from '../../interfaces.js';

/** Named parameter spec. */
export declare interface NamedParameterSchema {
  readonly name: string;
  readonly description: string;
  readonly type: readonly Mimetype[];
}

/** Action spec. */
export declare interface ActionSchema {
  readonly name: string;
  readonly inputs: readonly NamedParameterSchema[];
  readonly outputs: readonly NamedParameterSchema[];
}

/** Action input names. */
export declare type ActionInputNames<T extends ActionSchema> =
    T['inputs'][number]['name'];

/** Action inputs. */
export declare type ActionInputs<T extends ActionSchema> = Readonly<Record<ActionInputNames<T>, Input>>;

/** Action output names. */
export declare type ActionOutputNames<T extends ActionSchema> =
    T['outputs'][number]['name'];

/** Action outputs. */
export declare type ActionOutputs<T extends ActionSchema> = Readonly<Record<ActionOutputNames<T>, Output>>;

export declare type ActionFromSchema<T extends ActionSchema> =
    Action<ActionInputs<T>, ActionOutputs<T>>;
