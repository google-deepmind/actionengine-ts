/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { decode as b64decode, encode as b64encode } from '../../base64/index.js';
import { parseMimetype, stringifyMimetype } from '../../content/mime.js';
import {
  Action,
  Chunk,
  ChunkMetadata,
  Input,
  Session,
} from '../../interfaces.js';

import * as eg from './evergreen_spec.js';
import {
  ActionFromSchema,
  ActionInputs,
  ActionOutputs,
  ActionSchema,
} from './interfaces.js';
import {
  CachingConnectionManagerFactory,
  ConnectionManager,
  WebSocketConnectionManagerFactoryFn,
} from './net.js';

export interface StreamIdGenerator {
  generateStreamId(streamName: string): string;
}

class UuidStreamIdGenerator implements StreamIdGenerator {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateStreamId(streamName: string): string {
    return crypto.randomUUID();
  }
}

export class Options {
  constructor(
    readonly backend: string,
    readonly idGenerator: StreamIdGenerator,
    readonly connectionFactory: CachingConnectionManagerFactory<unknown>,
  ) { }
}

function getUuids<T extends ActionSchema>(
  inputs: ActionInputs<T>,
  outputs: ActionOutputs<T>,
  idGenerator: StreamIdGenerator,
): [Record<string, string>, Record<string, string>] {
  const outputIds: Record<string, string> = {};
  for (const outputKey of Object.keys(outputs)) {
    outputIds[outputKey] = idGenerator.generateStreamId(outputKey);
  }
  const inputIds: Record<string, string> = {};
  for (const inputKey of Object.keys(inputs)) {
    inputIds[inputKey] = idGenerator.generateStreamId(inputKey);
  }
  return [inputIds, outputIds];
}

async function writeToOutputs<T extends ActionSchema>(
  msg: eg.SessionMessage,
  outputIds: Record<string, string>,
  outputs: ActionOutputs<T>,
  childIdMapping: Record<string, string>,
  pending: Record<string, eg.NodeFragment[]>,
) {
  for (const nodeFragment of msg.nodeFragments ?? []) {
    const key = nodeFragment.id;
    if (!key) {
      console.warn('nodeFragment missing id');
      continue;
    }
    if (nodeFragment.childIds) {
      for (const childId of nodeFragment.childIds) {
        childIdMapping[childId] = childIdMapping[key];
        const existing = pending[childId];
        if (existing) {
          const copy = [...existing];
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete pending[childId];
          for (const existingNodeFragment of copy) {
            await writeToOutputs(
              { nodeFragments: [existingNodeFragment] },
              outputIds,
              outputs,
              childIdMapping,
              pending,
            );
          }
        }
      }
      const streamKey = childIdMapping[key];
      const stream = outputs[streamKey as keyof ActionOutputs<T>];
      if (stream && !nodeFragment.continued && outputIds[key]) {
        await stream.close();
      }
      continue;
    }
    const streamKey = childIdMapping[key];
    if (!streamKey) {
      const existing = pending[key] ?? [];
      existing.push(nodeFragment);
      pending[key] = existing;
      continue;
    }
    const stream = outputs[streamKey as keyof ActionOutputs<T>];
    const metadata: ChunkMetadata = {
      mimetype: parseMimetype(nodeFragment.chunkFragment?.metadata?.mimetype),
      role: nodeFragment.chunkFragment?.metadata?.role,
    };
    const data = nodeFragment.chunkFragment?.data
      ? b64decode(nodeFragment.chunkFragment.data)
      : undefined;
    const ref = nodeFragment.chunkFragment?.ref;
    const chunk = data ? { metadata, data } : ref ? { metadata, ref } : { metadata };
    await stream.write(chunk as Chunk);
    if (!nodeFragment.continued && outputIds[key]) {
      await stream.close();
    }
  }
}

function sendAction(
  connectionManager: ConnectionManager<unknown>,
  uri: string,
  action: ActionSchema,
  inputIds: Record<string, string>,
  outputIds: Record<string, string>,
) {
  const actionMessage: eg.SessionMessage = {
    actions: [
      {
        targetSpec: {
          id: uri,
        },
        name: action.name,
        inputs: Object.keys(inputIds).map((input) => {
          return {
            name: input,
            id: inputIds[input],
          };
        }),
        outputs: Object.keys(outputIds).map((output) => {
          return {
            name: output,
            id: outputIds[output],
          };
        }),
      },
    ],
  };
  connectionManager.send(actionMessage);
}

// Read the response.
function sendInput<T extends ActionSchema>(
  connectionManager: ConnectionManager<unknown>,
  inputs: ActionInputs<T>,
  inputIds: Record<string, string>,
) {
  for (const [k, v] of Object.entries(inputs)) {
    void (async (key: string, stream: Input) => {
      let seq = 0;
      for await (const chunk of stream) {
        const chunkFragment: eg.Chunk = {};
        chunkFragment.metadata = {
          mimetype: stringifyMimetype(chunk.metadata?.mimetype),
          role: chunk.metadata?.role,
        };
        if (chunk.data) {
          chunkFragment.data = b64encode(chunk.data);
        }
        const dataMsg: eg.SessionMessage = {
          nodeFragments: [
            {
              id: inputIds[key],
              chunkFragment,
              seq: seq++,
              continued: true,
            },
          ],
        };
        connectionManager.send(dataMsg);
      }
      // close
      const closeMsg: eg.SessionMessage = {
        nodeFragments: [
          {
            id: inputIds[key],
            seq: seq++,
            continued: false,
          },
        ],
      };
      connectionManager.send(closeMsg);
    })(k, v as Input);
  }
}

async function runEvergreenAction<T extends ActionSchema>(
  session: Session,
  uri: string,
  action: T,
  inputs: ActionInputs<T>,
  outputs: ActionOutputs<T>,
  options: Options,
) {
  const connectionManager = options.connectionFactory.getConnection(
    session,
    options.backend,
  );
  await connectionManager.connect();

  // Create uuids for the input and output streams.
  const [inputIds, outputIds] = getUuids(inputs, outputs, options.idGenerator);
  const childIdMapping: Record<string, string> = {};
  for (const output of Object.keys(outputIds)) {
    childIdMapping[outputIds[output]] = output;
  }
  const pending: Record<string, eg.NodeFragment[]> = {};

  connectionManager.registerSessionMessageCallback((msg: eg.SessionMessage) => {
    void writeToOutputs(msg, outputIds, outputs, childIdMapping, pending);
  });

  sendAction(connectionManager, uri, action, inputIds, outputIds);
  sendInput(connectionManager, inputs, inputIds);

  // TODO(doug): await all the writes to finish.
}
class EvergreenAction<T extends ActionSchema> extends Action {
  constructor(
    private readonly uri: string,
    private readonly action: T,
    private readonly options: Options,
  ) {
    super();
  }
  async run(
    session: Session,
    inputs: ActionInputs<T>,
    outputs: ActionOutputs<T>,
  ) {
    await runEvergreenAction(
      session,
      this.uri,
      this.action,
      inputs,
      outputs,
      this.options,
    );
  }
}

const defaultConnectionFactory =
  new CachingConnectionManagerFactory<unknown>(WebSocketConnectionManagerFactoryFn);

let lazyBackend: string | undefined = undefined;

/** Sets the backend address wss://myapi/address?key=mykey. */
export function setBackend(address: string) {
  lazyBackend = address;
}

function getBackend(): string {
  if (lazyBackend === undefined) {
    throw new Error('No backend address set, call setBackend().');
  }
  return lazyBackend;
}

export function action<T extends ActionSchema>(
  uri: string,
  action: T,
  options?: Options,
): ActionFromSchema<T> {
  options ??= new Options(
    getBackend(),
    new UuidStreamIdGenerator(),
    defaultConnectionFactory,
  );
  return new EvergreenAction<T>(uri, action, options);
}
