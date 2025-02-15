/**
 * @fileoverview Library for working with lazy tree like stream of chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Chunk, ChunkMetadata, Content } from '../interfaces.js';
/**
 * Factory for a template literal for constructing a prompt with specific
 * metadata.
 */
export declare function promptLiteralWithMetadata(metadataFn?: (chunk: Chunk) => ChunkMetadata): (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt.
 */
export declare const prompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt but always with user role.
 */
export declare const userPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt but always with system role.
 */
export declare const systemPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt but always with assistant role.
 */
export declare const assistantPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Template literal for constructing a prompt but always with context role.
 */
export declare const contextPrompt: (strings: TemplateStringsArray, ...values: unknown[]) => Content;
/**
 * Transforms a Content to a new Content with the given metadata.
 */
export declare function promptWithMetadata(prompt: Content, metadata: ChunkMetadata): Content;
