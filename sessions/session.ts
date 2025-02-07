/**
 * @fileoverview Internal methods for the SDK.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Processor, Dict, Action, ActionInputs, ActionOutputs, Chunk, Content, Pipe, Session as SessionInterface, SessionContext, SessionContextMiddleware, SessionProvider, SessionWriteOptions, ActionConstraints, ProcessorConstraints, ProcessorInputs, ProcessorOutputs } from '../interfaces.js';
import { isAsyncIterable, thenableAsyncIterable, WritableStream, ReadableStream } from '../stream/index.js';
import {merge} from '../async/index.js';

import { uniqueId } from './utils.js';


class SessionPipe implements Pipe {
    private readonly id = uniqueId();
    private seq = 0;
    private closed = false;

    constructor(private readonly context: SessionContext) { }

    [Symbol.asyncIterator](): AsyncIterator<Chunk> {
        return this.context.read(this.id)[Symbol.asyncIterator]();
    }
    
    async writeAndClose(content: Content): Promise<void> {
        if (content instanceof Array) {
            const l = content.length;
            for (let i=0;i<l-1;i++) {
                await this.write(content[i]);
            }
            await this.writeAndClose(content[l-1]);
        } else if (isAsyncIterable<Content>(content)) {
            await this.write(content);
            await this.close();
        } else {
            await this.writeChunk(content, false);
        }
    }

    async write(content: Content): Promise<void> {
        if (content instanceof Array) {
            for (const item of content) {
                await this.write(item)
            }
        } else if (isAsyncIterable<Content>(content)) {
            for await (const item of content) {
                await this.write(item);
            }
        } else {
            await this.writeChunk(content, true);
        }
    }

    error(reason?: string) {
        this.context.error(this.id, reason);
    }

    private async writeChunk(chunk: Chunk, continued: boolean): Promise<void> {
        const options: SessionWriteOptions = {seq: this.seq, continued}
        this.seq++;
        if (!continued) {
            this.closed = true;
        }
        await this.context.write(this.id, chunk, options);
    }

    async close() {
        // TODO(doug): Should this close by id in the context?
        if (this.closed) {
            console.warn('Already closed.');
            return;
        }
        this.closed = true;
        const seq = this.seq++;
        await this.context.write(this.id, emptyChunk, { seq, continued: false });
    }

    then = thenableAsyncIterable;
}

const emptyChunk = {metadata: {}, data: new Uint8Array()};

function isAction(maybeAction: Action|unknown): maybeAction is Action {
    if ((maybeAction as Action).run) {
        return true;
    }
    return false;
}

/** Session wrapper given a SessionContext. */
class Session implements SessionInterface {
    constructor(private readonly context: SessionContext) { }

    createPipe(): Pipe {
        return new SessionPipe(this.context);
    }
    
    run<T extends Action, U extends ActionConstraints<T> = ActionConstraints<T>>(action: T, inputs: ActionInputs<T>, outputs: U[]): Pick<ActionOutputs<T>,U>;
    // Runs a processor which is a convenience form transformed to an Action.
    run<T extends Processor, U extends ProcessorConstraints<T> = ProcessorConstraints<T>>(processor: T, inputs: ProcessorInputs<T>, outputs: U[]): Pick<ProcessorOutputs<T>,U>;
    run(
        actionOrProcessor: Action | Processor, inputs: Dict<ReadableStream<Chunk>>, outputs: string[]): Dict<ReadableStream<Chunk>> {
        // TODO(doug): Verify that the inputs and outputs are in the current session
        const outs = Object.fromEntries(outputs.map((k) => [k, this.createPipe()]));
        // context.
        if (isAction(actionOrProcessor)) {
            void actionOrProcessor.run(this, inputs, outs);
        } else {
            void writeOutputs(actionOrProcessor(joinInputs(inputs)), outs);
        }
        return outs;
    }

    // async run<T extends Chunk, U extends Chunk>(processor: Processor<T,U>, inputs: Dict<ReadableStream<T>>, outputs: Dict<WritableStream<U>>): Promise<void>;
    // async run<T extends Action>(
    //     action: T, inputs: ActionInputs<T>,
    //     outputs: ActionOutputs<T>): Promise<void>;
    // async run(
    //     actionOrProcessor: Action | Processor, inputs: Dict<ReadableStream<Chunk>>, outputs: Dict<WritableStream<Chunk>>): Promise<void> {
    //     // TODO(doug): Verify that the inputs and outputs are in the current session
    //     // context.
    //     if (isAction(actionOrProcessor)) {
    //         await actionOrProcessor.run(this, inputs, outputs);
    //         return;
    //     }
    //     await writeOutputs(actionOrProcessor(joinInputs(inputs)), outputs);
    // }
 
    async close(): Promise<void> {
        await this.context.close();
    }
}

/** Adds the name to each item in the Chunk stream. */
async function * withName(name: string, stream: ReadableStream<Chunk>): AsyncGenerator<[string, Chunk]> {
    for await (const c of stream) {
        yield [name, c];
    }
}

/** Joins the inputs in the dict into an eager stream of chunks with named key. */
async function * joinInputs(inputs: Dict<ReadableStream<Chunk>>): AsyncGenerator<[string, Chunk]> {
    const streams = Object.keys(inputs).map((k) => withName(k, inputs[k]));
    yield* merge(...streams);
}

/** Writes the unified stream of outputs to a dict of writable streams. */
async function writeOutputs(unified: AsyncIterable<[string, Chunk]>, outputs: Dict<WritableStream<Chunk>>) {
    for await (const [k,c] of unified) {
        outputs[k].write(c);
    }
    for (const v of Object.values(outputs)) {
        v.close();
    }
}

/** Provides a session. */
export function sessionProvider(contextProvider: () => SessionContext):
    SessionProvider {
    return (...middleware: SessionContextMiddleware[]) => {
        let c: SessionContext = contextProvider();
        if (middleware) {
            for (const m of middleware.reverse()) {
                c = m(c);
            }
        }
        return new Session(c);
    }
}
