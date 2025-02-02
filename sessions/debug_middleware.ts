/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chunk, InternalChunk, SessionContext, SessionContextMiddleware } from "../interfaces.js";
import { chunkText } from "../content/content.js";

class DebugContext implements SessionContext {
    constructor(private readonly context: SessionContext) {}
    read(id: string): AsyncIterable<Chunk> {
        async function* readAndLog() {
         for await (const chunk of this.context.read(id)) {
            console.log(`Reading from ${id}`, chunkText(chunk));
            yield chunk;
         }
        }
        return readAndLog();
    }
    async write(id: string, chunk: InternalChunk): Promise<void> {
        console.log(`Writing ${id}`, chunkText(chunk), chunk.seq, chunk.continued);
        await this.context.write(id, chunk);
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