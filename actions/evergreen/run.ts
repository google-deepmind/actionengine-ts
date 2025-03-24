/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {decode as b64decode, encode as b64encode} from '../../base64/index.js';
import {parseMimetype, stringifyMimetype} from '../../content/mime.js';
import {Action, Chunk, ChunkMetadata, Input, Session} from '../../interfaces.js';

import * as eg from './evergreen_spec.js';
import {ActionFromSchema, ActionInputs, ActionOutputs, ActionSchema} from './interfaces.js';

const socketMap = new Map<Session, WebSocket>();

async function getSocket(session: Session): Promise<WebSocket> {
  let socket = socketMap.get(session);
  if (socket && socket.readyState !== WebSocket.OPEN) {
    socket = undefined;
    socketMap.delete(session);
  }
  if (!socket) {
    const s = new WebSocket(getBackend());
    s.binaryType = 'blob';
    await new Promise<void>((resolve, reject) => {
      s.addEventListener('open', () => {
        s.removeEventListener('error', reject);
        s.removeEventListener('close', reject);
        resolve();
      });
      s.addEventListener('error', reject);
      s.addEventListener('close', reject);
    });
    socket = s;
    socketMap.set(session, s);
  }
  return socket;
}

function getUuids<T extends ActionSchema>(
    inputs: ActionInputs<T>, outputs: ActionOutputs<T>):
    [Record<string, string>, Record<string, string>] {
  const outputIds: Record<string, string> = {};
  for (const output of Object.keys(outputs)) {
    outputIds[output] = crypto.randomUUID();
  }
  const inputIds: Record<string, string> = {};
  for (const input of Object.keys(inputs)) {
    inputIds[input] = crypto.randomUUID();
  }
  return [inputIds, outputIds];
}

function handleMessages(socket: WebSocket, callbacks: {
  onmessage: (msg: eg.SessionMessage) => void,
  onerror: (event: Event) => void,
  onclose: (event: Event) => void,
}) {
  // Set up the reading of the response.
  socket.onmessage = async (event: MessageEvent) => {
    let message: eg.SessionMessage;
    switch (event.type) {
      case 'text':
      case 'message':
      case 'binary':
        const data = event.data as unknown;
        if (data instanceof Blob) {
          const buf = await data.arrayBuffer();
          message = JSON.parse(new TextDecoder().decode(new Uint8Array(buf))) as
              eg.SessionMessage;
        } else if (data instanceof ArrayBuffer) {
          message =
              JSON.parse(new TextDecoder().decode(new Uint8Array(data))) as
              eg.SessionMessage;
        } else if (typeof data === 'string') {
          message = JSON.parse(data) as eg.SessionMessage;
        } else {
          throw new Error(
              `Unsupported type ${socket.binaryType} ${typeof data}`);
        }
        break;
      default:
        throw new Error(`Unknown message type ${event.type}`);
    }
    callbacks.onmessage(message);
  };
  socket.onerror = (event) => {
    console.info('Websocket error', event, socket);
    callbacks.onerror(event);
  };
  socket.onclose = (event) => {
    // See
    // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code#value
    // for mapping from code to explanation.
    console.info(
        `Websocket closed: ${event.reason} ${event.code}`, event, socket);
    callbacks.onclose(event);
  };
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
                {nodeFragments: [existingNodeFragment]},
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
    const data = nodeFragment.chunkFragment?.data ?
        b64decode(nodeFragment.chunkFragment.data) :
        undefined;
    const ref = nodeFragment.chunkFragment?.ref;
    const chunk = data ? {metadata, data} : ref ? {metadata, ref} : {metadata};
    await stream.write(chunk as Chunk);
    if (!nodeFragment.continued && outputIds[key]) {
      await stream.close();
    }
  }
}

function sendAction(
    socket: WebSocket,
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
  socket.send(JSON.stringify(actionMessage));
}


// Read the response.
function read<T extends ActionSchema>(
    socket: WebSocket, inputs: ActionInputs<T>,
    inputIds: Record<string, string>) {
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
        socket.send(JSON.stringify(dataMsg));
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
      socket.send(JSON.stringify(closeMsg));
    })(k, v as Input);
  }
}

async function runEvergreenAction<T extends ActionSchema>(
    session: Session,
    uri: string,
    action: T,
    inputs: ActionInputs<T>,
    outputs: ActionOutputs<T>,
) {
  const socket = await getSocket(session);

  // Create uuids for the input and output streams.
  const [inputIds, outputIds] = getUuids(inputs, outputs);
  const childIdMapping: Record<string, string> = {};
  for (const output of Object.keys(outputIds)) {
    childIdMapping[outputIds[output]] = output;
  }
  const pending: Record<string, eg.NodeFragment[]> = {};

  handleMessages(socket, {
    onmessage: (msg: eg.SessionMessage) => {
      void writeToOutputs(msg, outputIds, outputs, childIdMapping, pending);
    },
    onerror: (event: Event) => {
      console.log('error', event);
    },
    onclose: (event: Event) => {
      console.log('close', event);
    },
  });

  sendAction(socket, uri, action, inputIds, outputIds);

  read(socket, inputs, inputIds);

  // TODO(doug): await all the writes to finish.
}

class EvergreenAction<T extends ActionSchema> extends Action {
  constructor(
      private readonly uri: string,
      private readonly action: T,
  ) {
    super();
  }
  async run(
      session: Session, inputs: ActionInputs<T>, outputs: ActionOutputs<T>) {
    await runEvergreenAction(session, this.uri, this.action, inputs, outputs);
  }
}

let lazyBackend: string|undefined = undefined;

/** Sets the backend address wss://myapi/adddress?key=mykey. */
export function setBackend(address: string) {
  lazyBackend = address
}

function getBackend(): string {
  if (lazyBackend === undefined) {
    throw new Error('No backend address set, call setBackend().');
  }
  return lazyBackend;
}

export function action<T extends ActionSchema>(
    uri: string, action: T): ActionFromSchema<T> {
  return new EvergreenAction<T>(uri, action);
}