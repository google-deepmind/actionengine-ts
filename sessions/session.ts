/**
 * @fileoverview Internal methods for the SDK.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Action, ActionConfigs, ActionInputs, ActionOutputs, Chunk, Content, InternalChunk, Placeholder, Session as SessionInterface, SessionContext, SessionContextMiddleware, SessionProvider } from '../interfaces.js';
import { isAsyncIterable, thenableAsyncIterable } from '../stream/stream.js';

import { uniqueId } from './utils.js';


class SessionPlaceholder implements Placeholder {
    private readonly id = uniqueId();
    private seq = 0;
    private closed = false;

    constructor(private readonly context: SessionContext) { }

    [Symbol.asyncIterator](): AsyncIterator<Chunk> {
        return this.context.read(this.id)[Symbol.asyncIterator]();
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
            await this.writeChunk(content);
        }
    }

    error(reason?: string) {
        this.context.error(this.id, reason);
    }

    private async writeChunk(chunk: Chunk): Promise<void> {
        const c = { ...chunk } as InternalChunk;
        c.seq = this.seq;
        this.seq++;
        if (c.continued === undefined) {
            c.continued = true;
        }
        if (!c.continued) {
            this.closed = true;
        }
        await this.context.write(this.id, c);
    }

    async close() {
        // TODO(doug): Should this close by id in the context?
        if (this.closed) {
            console.warn('Placeholder is already closed.');
            return;
        }
        this.closed = true;
        const seq = this.seq++;
        await this.context.write(this.id, { seq, continued: false } as InternalChunk);
    }

    then = thenableAsyncIterable;
}

/** Session wrapper given a SessionContext. */
class Session implements SessionInterface {
    private actionProviders =
        new Map<abstract new () => Action, new () => Action>();

    constructor(private readonly context: SessionContext) { }

    placeholder(): Placeholder {
        return new SessionPlaceholder(this.context);
    }

    async run<T extends Action>(
        action: abstract new () => T, inputs: ActionInputs<T>,
        outputs: ActionOutputs<T>, configs?: ActionConfigs<T>): Promise<void> {
        // TODO(doug): Verify that the inputs and outputs are in the current session
        // context.
        let actionCtor = this.actionProviders.get(action);
        if (!actionCtor) {
            actionCtor = action as (new () => T);
        }
        const actionInstance = new actionCtor();
        if (typeof actionInstance.run !== 'function') {
            const provided: string[] = [];
            for (const k of this.actionProviders.keys()) {
                provided.push(`${k.name}`);
            }
            throw new Error(`${action.name} is not provided. ${provided}`);
        }
        await actionInstance.run(this, inputs, outputs, configs);
    }

    async close(): Promise<void> {
        await this.context.close();
    }

    provide<T extends Action>(sym: abstract new () => T, impl: new () => T) {
        this.actionProviders.set(sym, impl);
    }
}

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

/** Wraps a sessionProvider with addional exposed actions. */
export function sessionWithActions<
    T extends Array<[abstract new () => Action, new () => Action]>>(
        provider: SessionProvider, actions: T): SessionProvider {
    return (...middleware: SessionContextMiddleware[]) => {
        const s = provider(...middleware);
        for (const [sym, impl] of actions) {
            s.provide(sym, impl);
        }
        return s;
    }
}
