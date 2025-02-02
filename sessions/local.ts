/**
 * @fileoverview Local session.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InternalChunk, Chunk, SessionContext } from "../interfaces.js";
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

    async write(id: string, chunk: InternalChunk): Promise<void> {
        let pl = this.nodeMap.get(id);
        if (pl === undefined) {
            pl = this.createStream(id);
        }
        const lastSeq = this.sequenceOrder.get(id);
        if ((lastSeq + 1) !== chunk.seq) {
            throw new Error(`Out of order sequence writes not yet supported. last seq ${lastSeq}, current seq ${chunk.seq}`);
        }
        this.sequenceOrder.set(id, chunk.seq);
        // Skip writing empty data and ref as it is just a close signal.
        if(chunk.data !== undefined || chunk.ref !== undefined) {
            pl.write(chunk);
        }
        if (chunk.continued !== true) {
            pl.close();
        }
    }
    error(id: string, reason?: string) {
        let pl = this.nodeMap.get(id);
        if (pl === undefined) {
            throw new Error(`No such id exists ${id}`);
        }
        pl.error(reason);
    }
    read(id: string): AsyncIterable<Chunk> {
        let pl = this.nodeMap.get(id);
        if (pl === undefined) {
            pl = this.createStream(id);
        }
        return pl;
    };

    async close(): Promise<void> {
        for (const stream of this.nodeMap.values()) {
            stream.close();
        }
        this.nodeMap.clear();
        this.sequenceOrder.clear();
    }
}

export const local = sessionProvider(() => new LocalContext());
