/**
 * @fileoverview Local session.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Chunk, SessionContext, SessionWriteOptions } from "../interfaces.js";
import { createStream } from "../stream/stream.js";
import { Stream } from "../stream/interfaces.js";
import { sessionProvider } from "./session.js";

class LocalContext implements SessionContext {
    private nodeMap = new Map<string, Stream<Chunk>>();
    private sequenceOrder = new Map<string, number>();

    private createStream(id: string) {
        const pl = createStream<Chunk>();
        this.nodeMap.set(id, pl);
        this.sequenceOrder.set(id, -1);
        return pl;
    }

    async write(id: string, chunk: Chunk, options?: SessionWriteOptions): Promise<void> {
        let pl = this.nodeMap.get(id);
        pl ??= this.createStream(id);
        const lastSeq = this.sequenceOrder.get(id);
        if (lastSeq === undefined) {
            throw new Error(`Sequence not found for ${id}`);
        }
        const seq = options?.seq ?? 0;
        if ((lastSeq + 1) !== seq) {
            throw new Error(`Out of order sequence writes not yet supported. last seq ${lastSeq}, current seq ${seq}`);
        }
        this.sequenceOrder.set(id, seq);
        // Skip writing empty data and ref as it is just a close signal explicit check.
        if (chunk.data !== undefined || chunk.ref !== undefined) {
            await pl.write(chunk);
        }
        const continued = options?.continued ?? false;
        if (!continued) {
            await pl.close();
        }
    }
    error(id: string, reason?: string) {
        const pl = this.nodeMap.get(id);
        if (pl === undefined) {
            throw new Error(`No such id exists ${id}`);
        }
        pl.error(reason);
    }
    read(id: string): AsyncIterable<Chunk> {
        let pl = this.nodeMap.get(id);
        pl ??= this.createStream(id);
        return pl;
    };

    async close(): Promise<void> {
        for (const stream of this.nodeMap.values()) {
            await stream.close();
        }
        this.nodeMap.clear();
        this.sequenceOrder.clear();
    }
}

export const local = sessionProvider(() => new LocalContext());
