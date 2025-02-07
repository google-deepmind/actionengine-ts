/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chunk, SessionContext, SessionContextMiddleware, SessionWriteOptions } from "../../interfaces.js";
import { chunkText } from "../../content/content.js";

class DebugContext implements SessionContext {
    constructor(private readonly context: SessionContext) { }
    read(id: string): AsyncIterable<Chunk> {
        async function* readAndLog(context: SessionContext) {
            for await (const chunk of context.read(id)) {
                console.log(`Reading from ${id}`, chunkText(chunk));
                yield chunk;
            }
        }
        return readAndLog(this.context);
    }
    async write(id: string, chunk: Chunk, options?: SessionWriteOptions): Promise<void> {
        console.log(`Writing ${id}`, chunkText(chunk), options?.seq, options?.continued);
        await this.context.write(id, chunk, options);
    }
    error(id: string, reason?: string): void {
        console.error(reason);
        this.context.error(id, reason);
    }
    async close(): Promise<void> {
        await this.context.close();
    }

}

export const debug: SessionContextMiddleware = (context: SessionContext) => {
    return new DebugContext(context);
}