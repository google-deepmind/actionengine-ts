/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Mimetype } from "../interfaces";
/**
 * Converts a mimetype to a string.
 */
export declare function stringifyMimetype(mimetype?: Mimetype): string;
/**
 * Parses a mimetype from a string.
 */
export declare function parseMimetype(mimetype?: string): Mimetype;
