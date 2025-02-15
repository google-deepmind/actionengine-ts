/**
 * @fileoverview Add nodejs polyfills.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {Blob} from 'blob-polyfill';
import WebSocket from 'ws';

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// interfaces.js
var Action = class {
};

// content/index.js
var content_exports = {};
__export(content_exports, {
  JSON_MIME_TYPE: () => JSON_MIME_TYPE,
  ROLE: () => ROLE,
  TEXT_MIME_TYPE: () => TEXT_MIME_TYPE,
  assistantPrompt: () => assistantPrompt,
  audioChunk: () => audioChunk,
  blobChunk: () => blobChunk,
  chunkBlob: () => chunkBlob,
  chunkJson: () => chunkJson,
  chunkText: () => chunkText,
  contextPrompt: () => contextPrompt,
  fetchChunk: () => fetchChunk,
  imageChunk: () => imageChunk,
  isChunk: () => isChunk,
  isDataChunk: () => isDataChunk,
  isJsonChunk: () => isJsonChunk,
  isProtoMessage: () => isProtoMessage,
  isRefChunk: () => isRefChunk,
  isTextChunk: () => isTextChunk,
  jsonChunk: () => jsonChunk,
  parseMimetype: () => parseMimetype,
  prompt: () => prompt2,
  promptLiteralWithMetadata: () => promptLiteralWithMetadata,
  promptWithMetadata: () => promptWithMetadata,
  stringifyMimetype: () => stringifyMimetype,
  systemPrompt: () => systemPrompt,
  textChunk: () => textChunk,
  userPrompt: () => userPrompt,
  videoChunk: () => videoChunk,
  withMetadata: () => withMetadata
});

// content/content.js
var ROLE;
(function(ROLE2) {
  ROLE2["USER"] = "USER";
  ROLE2["ASSISTANT"] = "ASSISTANT";
  ROLE2["SYSTEM"] = "SYSTEM";
  ROLE2["CONTEXT"] = "CONTEXT";
})(ROLE || (ROLE = {}));
function isTextChunk(maybeChunk) {
  return maybeChunk.metadata?.mimetype?.type === "text";
}
function isJsonChunk(maybeChunk) {
  const chunk = maybeChunk;
  const mimetype = chunk.metadata?.mimetype;
  return mimetype?.type === "application" && mimetype?.subtype === "json";
}
function isRefChunk(maybeChunk) {
  return maybeChunk.ref !== void 0;
}
function isDataChunk(maybeChunk) {
  return maybeChunk.data !== void 0;
}
function isChunk(maybeChunk) {
  const c = maybeChunk;
  const hasPayload = c.ref !== void 0 || c.data !== void 0;
  const hasMetadata = c.metadata !== void 0;
  return hasPayload || hasMetadata;
}
function jsonChunk(json, metadata = {}, replacer) {
  const defaultMetadata = {
    captureTime: /* @__PURE__ */ new Date()
  };
  return {
    metadata: {
      ...defaultMetadata,
      ...metadata,
      mimetype: {
        ...metadata?.mimetype,
        type: "application",
        subtype: "json"
      }
    },
    data: new TextEncoder().encode(JSON.stringify(json, replacer))
  };
}
function chunkJson(chunk, reviver) {
  if (isJsonChunk(chunk)) {
    if (isDataChunk(chunk)) {
      const text = new TextDecoder().decode(chunk.data);
      return JSON.parse(text, reviver);
    }
    if (chunk.ref) {
      throw new Error("Ref chunk not yet implemented");
    }
    return null;
  }
  throw new Error("Not a json mimetype for the chunk.");
}
function textChunk(text, metadata = {}) {
  const defaultMetadata = {
    captureTime: /* @__PURE__ */ new Date()
  };
  return {
    metadata: {
      ...defaultMetadata,
      ...metadata,
      mimetype: {
        ...metadata?.mimetype,
        type: "text",
        subtype: "plain"
      }
    },
    data: new TextEncoder().encode(text)
  };
}
function chunkText(chunk, throwOnError = false) {
  if (isTextChunk(chunk)) {
    if (isDataChunk(chunk)) {
      const text = new TextDecoder().decode(chunk.data);
      return text;
    }
    if (chunk.ref) {
      throw new Error("Ref chunk not yet implemented");
    }
    return "";
  }
  if (throwOnError) {
    throw new Error(`Unsupported chunk type: ${chunk}`);
  }
  return JSON.stringify(chunk);
}
function chunkBlob(chunk) {
  let parts;
  if (isDataChunk(chunk)) {
    parts = [chunk.data];
  } else {
    throw new Error("Ref chunk not yet implemented");
  }
  const blob = new Blob(parts, {
    type: stringifyMimetype(chunk.metadata?.mimetype)
  });
  return blob;
}
async function imageChunk(image, metadata = {}) {
  if (!image.complete) {
    await new Promise((resolve) => {
      image.addEventListener("load", () => {
        resolve();
      }, { once: true });
    });
  }
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to get 2d context");
  }
  ctx.drawImage(image, 0, 0, image.width, image.height);
  const blob = await canvas.convertToBlob();
  return await blobChunk(blob, metadata);
}
async function audioChunk(audio, metadata = {}) {
  return fetchChunk(fetch(audio.src), metadata);
}
async function videoChunk(video, metadata = {}) {
  return fetchChunk(fetch(video.src), metadata);
}
async function fetchChunk(resp, metadata = {}) {
  resp = await Promise.resolve(resp);
  return blobChunk(await resp.blob(), metadata);
}
async function blobChunk(blob, metadata = {}) {
  const defaultMetadata = {
    captureTime: /* @__PURE__ */ new Date()
  };
  const mimetype = parseMimetype(blob.type);
  return {
    metadata: {
      ...defaultMetadata,
      ...metadata,
      mimetype
    },
    data: new Uint8Array(await blob.arrayBuffer())
  };
}
function withMetadata(chunk, metadata) {
  return {
    ...chunk,
    metadata: {
      ...chunk.metadata,
      ...metadata
    }
  };
}
function stringifyMimetype(mimetype) {
  if (!mimetype) {
    return "application/octet-stream";
  }
  let result = "";
  if (!mimetype.type) {
    return result;
  }
  result += mimetype.type;
  if (!mimetype.subtype) {
    return result;
  }
  result += "/";
  if (mimetype.prefix) {
    result += `${mimetype.prefix}.`;
  }
  result += mimetype.subtype;
  if (mimetype.suffix) {
    result += `+${mimetype.suffix}`;
  }
  if (mimetype.parameters) {
    for (const [key, value] of Object.entries(mimetype.parameters)) {
      result += `; ${key}=${value}`;
    }
  }
  return result;
}
function parseMimetype(mimetype) {
  if (!mimetype) {
    return { type: "application", subtype: "octet-stream" };
  }
  let parameters = void 0;
  const paramParts = mimetype.split(";");
  if (paramParts.length > 1) {
    mimetype = mimetype.substring(0, paramParts[0].length);
    parameters = {};
    for (let i = 1; i < paramParts.length; i++) {
      const [key, value] = paramParts[i].trim().split("=");
      parameters[key] = value;
    }
  }
  const parts = mimetype.split("/");
  if (parts.length !== 2) {
    throw new Error(`Invalid mimetype: ${mimetype}`);
  }
  const [type, rest] = parts;
  let subtype = void 0;
  let prefix = void 0;
  let suffix = void 0;
  const vndSplit = rest.lastIndexOf(".");
  if (vndSplit >= 0) {
    prefix = rest.slice(0, vndSplit);
    subtype = rest.slice(vndSplit + 1);
  } else {
    subtype = rest;
  }
  const suffixSplit = subtype.indexOf("+");
  if (suffixSplit >= 0) {
    suffix = subtype.slice(suffixSplit + 1);
    subtype = subtype.slice(0, suffixSplit);
  }
  return {
    type,
    subtype,
    prefix,
    suffix,
    parameters
  };
}
function isProtoMessage(mimeType, messageType) {
  return mimeType.type === "application" && mimeType.subtype === "x-protobuf" && mimeType.parameters?.["type"] === messageType;
}
var JSON_MIME_TYPE = {
  type: "application",
  subtype: "json"
};
var TEXT_MIME_TYPE = {
  type: "text",
  subtype: "plain"
};

// stream/stream.js
if (typeof Promise.withResolvers === "undefined") {
  Promise.withResolvers = () => {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
var Stream = class {
  closed = false;
  children = [];
  iterators = [];
  errorValue;
  /**
   * Writes a value to the stream.
   */
  write(value) {
    if (this.closed) {
      throw new Error("Stream is closed");
    }
    this.children.push(value);
    for (const iterator of [...this.iterators]) {
      iterator.write(value);
    }
  }
  /**
   * Write and close.
   */
  writeAndClose(value) {
    this.write(value);
    this.close();
  }
  /**
   * Closes the stream.
   */
  close() {
    this.closed = true;
    for (const iterator of [...this.iterators]) {
      iterator.close();
    }
  }
  get isClosed() {
    return this.closed;
  }
  get size() {
    return this.children.length;
  }
  get items() {
    return [...this.children];
  }
  getError() {
    return this.errorValue;
  }
  /*
   * Errors the stream if there has been a problem.
   */
  error(reason) {
    this.errorValue = reason;
    this.closed = true;
    for (const iterator of [...this.iterators]) {
      iterator.error(reason);
    }
  }
  /**
   * Async iterator over the raw StreamItems being pushed in.
   */
  rawAsyncIterator() {
    const iterator = new StreamIterator(this, this.children, () => {
      const index = this.iterators.indexOf(iterator);
      if (index >= 0) {
        this.iterators.splice(index, 1);
      }
    });
    this.iterators.push(iterator);
    return iterator;
  }
  [Symbol.asyncIterator]() {
    const iter = this.rawAsyncIterator();
    const stream = iteratorToIterable(iter);
    const chunks = async function* () {
      try {
        yield* leaves(stream);
      } finally {
        if (iter.return) {
          void iter.return();
        }
      }
    }();
    return chunks[Symbol.asyncIterator]();
  }
  then = thenableAsyncIterable;
};
async function* iteratorToIterable(iter) {
  while (true) {
    const result = await iter.next();
    if (result.done)
      break;
    yield result.value;
  }
}
var StreamIterator = class {
  stream;
  done;
  writeQueue = [];
  readQueue = [];
  constructor(stream, current, done) {
    this.stream = stream;
    this.done = done;
    this.writeQueue = [...current];
  }
  write(value) {
    const queued = this.readQueue.shift();
    if (queued) {
      queued.resolve({ done: false, value });
    } else {
      this.writeQueue.push(value);
    }
  }
  close() {
    const queued = this.readQueue.shift();
    if (queued) {
      queued.resolve({ done: true, value: void 0 });
    }
  }
  error(error) {
    const queued = this.readQueue.shift();
    if (queued) {
      queued.reject(error);
    }
  }
  next() {
    const value = this.writeQueue.shift();
    if (value) {
      return Promise.resolve({ done: false, value });
    }
    if (this.stream.getError() !== void 0) {
      return Promise.reject(this.stream.getError());
    }
    const done = this.writeQueue.length === 0 && this.stream.isClosed;
    if (done) {
      this.done();
      return Promise.resolve({ done, value: void 0 });
    }
    const next = Promise.withResolvers();
    this.readQueue.push(next);
    return next.promise;
  }
  return(value) {
    this.done();
    return Promise.resolve({ done: true, value });
  }
};
function createStream() {
  return new Stream();
}
function isAsyncIterable(maybeAsyncIterable) {
  const iter = maybeAsyncIterable;
  return typeof iter[Symbol.asyncIterator] === "function";
}
async function* leaves(items) {
  if (items instanceof Array) {
    for (const node of items) {
      yield* leaves(node);
    }
  } else if (isAsyncIterable(items)) {
    for await (const node of items) {
      yield* leaves(node);
    }
  } else {
    yield items;
  }
}
function thenableAsyncIterable(onfulfilled, onrejected) {
  const aggregate = async () => {
    const items = [];
    for await (const item of this) {
      items.push(item);
    }
    return items;
  };
  return aggregate().then(onfulfilled, onrejected);
}

// content/prompt.js
function transformToContent(value, metadataFn) {
  if (typeof window !== "undefined") {
    if (value instanceof HTMLImageElement) {
      value = imageChunk(value);
    } else if (value instanceof HTMLAudioElement) {
      value = audioChunk(value);
    } else if (value instanceof HTMLVideoElement) {
      value = videoChunk(value);
    }
  }
  if (typeof value === "string") {
    value = textChunk(value);
  }
  if (value instanceof Blob) {
    value = blobChunk(value);
  }
  if (value instanceof Response) {
    value = fetchChunk(value);
  }
  if (isChunk(value)) {
    if (metadataFn) {
      value = withMetadata(value, metadataFn(value));
    }
  }
  if (value instanceof Promise) {
    const pl = createStream();
    value.then((v) => {
      if (isChunk(v)) {
        if (metadataFn) {
          v = withMetadata(v, metadataFn(v));
        }
      } else {
        v = transformToContent(v, metadataFn);
      }
      pl.write(v);
      pl.close();
    }).catch((err) => {
      pl.error(err);
    });
    value = pl;
  }
  if (!assertIsContent(value)) {
    throw new Error("Unsupported value type");
  }
  return value;
}
function promptLiteralWithMetadata(metadataFn) {
  function prompt3(strings, ...values) {
    const node = [];
    const l = values.length;
    let str = "";
    for (let i = 0; i < l; i++) {
      str += strings[i];
      let value = values[i];
      if (value === void 0 || value === null) {
        value = "";
      }
      if (typeof value === "string") {
        str += value;
      } else {
        if (str) {
          let chunk = textChunk(str);
          if (metadataFn) {
            chunk = withMetadata(chunk, metadataFn(chunk));
          }
          node.push(chunk);
        }
        str = "";
        node.push(transformToContent(value, metadataFn));
      }
    }
    str += strings[l];
    if (str) {
      let chunk = textChunk(str);
      if (metadataFn) {
        chunk = withMetadata(chunk, metadataFn(chunk));
      }
      node.push(chunk);
    }
    if (node.length === 1) {
      return node[0];
    }
    return node;
  }
  return prompt3;
}
function assertIsContent(value) {
  if (Array.isArray(value)) {
    return value.every((v) => assertIsContent(v));
  }
  if (isChunk(value) || isAsyncIterable(value)) {
    return true;
  }
  return false;
}
var prompt2 = promptLiteralWithMetadata();
var userPrompt = promptLiteralWithMetadata(() => ({ role: ROLE.USER }));
var systemPrompt = promptLiteralWithMetadata(() => ({
  role: ROLE.SYSTEM
}));
var assistantPrompt = promptLiteralWithMetadata(() => ({
  role: ROLE.ASSISTANT
}));
var contextPrompt = promptLiteralWithMetadata(() => ({
  role: ROLE.CONTEXT
}));
function promptWithMetadata(prompt3, metadata) {
  if (isChunk(prompt3)) {
    const chunk = withMetadata(prompt3, metadata);
    return chunk;
  } else if (prompt3 instanceof Array) {
    const list = prompt3.map((child) => promptWithMetadata(child, metadata));
    return list;
  } else if (isAsyncIterable(prompt3)) {
    const pipe = createStream();
    const source = prompt3;
    const transform = async () => {
      try {
        for await (const item of source) {
          pipe.write(promptWithMetadata(item, metadata));
        }
      } catch (err) {
        pipe.error(`${err}`);
      } finally {
        pipe.close();
      }
    };
    void transform();
    return pipe;
  }
  throw new Error(`Unsupported type ${prompt3}`);
}

// sessions/index.js
var sessions_exports = {};
__export(sessions_exports, {
  local: () => local,
  middleware: () => middleware_exports,
  sessionProvider: () => sessionProvider
});

// async/index.js
var async_exports = {};
__export(async_exports, {
  merge: () => merge
});
function raceWithIndex(promises) {
  const { promise, resolve, reject } = Promise.withResolvers();
  const l = promises.length;
  let complete = false;
  for (let i = 0; i < l; i++) {
    const p = promises[i];
    p.then((v) => {
      if (complete) {
        return;
      }
      complete = true;
      resolve([v, i]);
    }).catch((e) => {
      if (complete) {
        return;
      }
      complete = true;
      reject(e);
    });
  }
  return promise;
}
async function* merge(...arr) {
  const sources = [...arr].map((p) => {
    const iter = p;
    if (typeof iter[Symbol.asyncIterator] === "function") {
      return iter[Symbol.asyncIterator]();
    }
    return p;
  });
  const queue = sources.map((p) => p.next());
  while (queue.length > 0) {
    const [result, i] = await raceWithIndex(queue);
    if (result.done) {
      queue.splice(i, 1);
      sources.splice(i, 1);
    } else {
      queue[i] = sources[i].next();
      yield result.value;
    }
  }
}

// sessions/utils.js
var uniqueIdCounter = 1;
function uniqueId() {
  return `${uniqueIdCounter++}`;
}

// sessions/session.js
var SessionPipe = class {
  context;
  id = uniqueId();
  seq = 0;
  closed = false;
  constructor(context) {
    this.context = context;
  }
  [Symbol.asyncIterator]() {
    return this.context.read(this.id)[Symbol.asyncIterator]();
  }
  async writeAndClose(content) {
    if (content instanceof Array) {
      const l = content.length;
      for (let i = 0; i < l - 1; i++) {
        await this.write(content[i]);
      }
      await this.writeAndClose(content[l - 1]);
    } else if (isAsyncIterable(content)) {
      await this.write(content);
      await this.close();
    } else {
      await this.writeChunk(content, false);
    }
  }
  async write(content) {
    if (content instanceof Array) {
      for (const item of content) {
        await this.write(item);
      }
    } else if (isAsyncIterable(content)) {
      for await (const item of content) {
        await this.write(item);
      }
    } else {
      await this.writeChunk(content, true);
    }
  }
  error(reason) {
    this.context.error(this.id, reason);
  }
  async writeChunk(chunk, continued) {
    const options = { seq: this.seq, continued };
    this.seq++;
    if (!continued) {
      this.closed = true;
    }
    await this.context.write(this.id, chunk, options);
  }
  async close() {
    if (this.closed) {
      console.warn("Already closed.");
      return;
    }
    this.closed = true;
    const seq = this.seq++;
    await this.context.write(this.id, emptyChunk, { seq, continued: false });
  }
  then = thenableAsyncIterable;
};
var emptyChunk = {
  metadata: {},
  data: new Uint8Array(0)
};
function isAction(maybeAction) {
  if (maybeAction.run) {
    return true;
  }
  return false;
}
var Session = class {
  context;
  constructor(context) {
    this.context = context;
  }
  createPipe() {
    return new SessionPipe(this.context);
  }
  run(actionOrProcessor, inputs, outputs) {
    const outs = Object.fromEntries(outputs.map((k) => [k, this.createPipe()]));
    if (isAction(actionOrProcessor)) {
      void actionOrProcessor.run(this, inputs, outs);
    } else {
      void writeOutputs(actionOrProcessor(joinInputs(inputs)), outs);
    }
    return outs;
  }
  async close() {
    await this.context.close();
  }
};
async function* withName(name, stream) {
  for await (const c of stream) {
    yield [name, c];
  }
}
async function* joinInputs(inputs) {
  const streams = Object.keys(inputs).map((k) => withName(k, inputs[k]));
  yield* merge(...streams);
}
async function writeOutputs(unified, outputs) {
  for await (const [k, c] of unified) {
    outputs[k].write(c);
  }
  for (const v of Object.values(outputs)) {
    v.close();
  }
}
function sessionProvider(contextProvider) {
  return (...middleware) => {
    let c = contextProvider();
    if (middleware) {
      for (const m of middleware.reverse()) {
        c = m(c);
      }
    }
    return new Session(c);
  };
}

// sessions/local.js
var LocalContext = class {
  nodeMap = /* @__PURE__ */ new Map();
  sequenceOrder = /* @__PURE__ */ new Map();
  createStream(id) {
    const pl = createStream();
    this.nodeMap.set(id, pl);
    this.sequenceOrder.set(id, -1);
    return pl;
  }
  async write(id, chunk, options) {
    let pl = this.nodeMap.get(id);
    if (pl === void 0) {
      pl = this.createStream(id);
    }
    const lastSeq = this.sequenceOrder.get(id);
    if (lastSeq === void 0) {
      throw new Error(`Sequence not found for ${id}`);
    }
    const seq = options?.seq || 0;
    if (lastSeq + 1 !== seq) {
      throw new Error(`Out of order sequence writes not yet supported. last seq ${lastSeq}, current seq ${seq}`);
    }
    this.sequenceOrder.set(id, seq);
    if (chunk.data !== void 0 || chunk.ref !== void 0) {
      pl.write(chunk);
    }
    const continued = options?.continued || false;
    if (continued !== true) {
      pl.close();
    }
  }
  error(id, reason) {
    const pl = this.nodeMap.get(id);
    if (pl === void 0) {
      throw new Error(`No such id exists ${id}`);
    }
    pl.error(reason);
  }
  read(id) {
    let pl = this.nodeMap.get(id);
    if (pl === void 0) {
      pl = this.createStream(id);
    }
    return pl;
  }
  async close() {
    for (const stream of this.nodeMap.values()) {
      stream.close();
    }
    this.nodeMap.clear();
    this.sequenceOrder.clear();
  }
};
var local = sessionProvider(() => new LocalContext());

// sessions/middleware/index.js
var middleware_exports = {};
__export(middleware_exports, {
  debug: () => debug
});

// sessions/middleware/debug.js
var DebugContext = class {
  context;
  constructor(context) {
    this.context = context;
  }
  read(id) {
    async function* readAndLog(context) {
      for await (const chunk of context.read(id)) {
        console.log(`Reading from ${id}`, chunkText(chunk));
        yield chunk;
      }
    }
    return readAndLog(this.context);
  }
  async write(id, chunk, options) {
    console.log(`Writing ${id}`, chunkText(chunk), options?.seq, options?.continued);
    await this.context.write(id, chunk, options);
  }
  error(id, reason) {
    console.error(reason);
    this.context.error(id, reason);
  }
  async close() {
    await this.context.close();
  }
};
var debug = (context) => {
  return new DebugContext(context);
};

// actions/index.js
var actions_exports = {};
__export(actions_exports, {
  GenerateContent: () => GenerateContent,
  ReverseContent: () => ReverseContent,
  drive: () => drive_exports,
  google: () => google_exports
});

// actions/generate_content.js
var GenerateContent = class extends Action {
};

// actions/toy.js
var ReverseContent = class extends Action {
  async run(session, inputs, outputs) {
    for await (const chunk of inputs.prompt) {
      const text = chunkText(chunk);
      const reverse = text.split("").reverse().join("");
      outputs.response.write(textChunk(reverse, { role: ROLE.ASSISTANT }));
    }
    outputs.response.close();
  }
};

// actions/google/index.js
var google_exports = {};
__export(google_exports, {
  genai: () => genai_exports
});

// actions/google/genai.js
var genai_exports = {};
__export(genai_exports, {
  GenerateContent: () => GenerateContent2
});
import * as genai from "@google/genai";
var clients = /* @__PURE__ */ new Map();
function genAI(apiKey) {
  let client = clients.get(apiKey);
  if (!client) {
    client = new genai.Client({ vertexai: false, apiKey });
    clients.set(apiKey, client);
  }
  return client;
}
var GenerateContent2 = class extends GenerateContent {
  apiKey;
  model;
  constructor(apiKey, model) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }
  async run(session, inputs, outputs) {
    const prompt3 = await inputs.prompt;
    const promptString = prompt3.map((c) => chunkText(c)).join("");
    const response = await genAI(this.apiKey).models.generateContentStream({
      model: this.model,
      contents: promptString
    });
    for await (const chunk of response) {
      outputs.response.write(textChunk(chunk.text()));
    }
  }
};

// actions/drive/index.js
var drive_exports = {};
__export(drive_exports, {
  docToText: () => docToText
});

// actions/drive/auth.js
var OAUTH_CLIENT_ID = "";
var OAUTH_SCOPES = ["https://www.googleapis.com/auth/documents.readonly"];
function oauthSignIn() {
  const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
  const form = document.createElement("form");
  form.setAttribute("method", "GET");
  form.setAttribute("action", oauth2Endpoint);
  if (!OAUTH_CLIENT_ID) {
    OAUTH_CLIENT_ID = prompt("Google OAuth client");
  }
  const params = {
    "client_id": OAUTH_CLIENT_ID,
    // TODO: update with the URL if this is hosted persistently.
    // Register the domain under "Authorized JavaScript origins" and
    // "Authorized redirect URIs" in the Google Cloud console.
    "redirect_uri": "http://localhost:5432/examples/drive",
    "response_type": "token",
    "scope": OAUTH_SCOPES.join(" "),
    "include_granted_scopes": "true",
    "state": "pass-through value"
  };
  for (const [k, v] of Object.entries(params)) {
    const input = document.createElement("input");
    input.setAttribute("type", "hidden");
    input.setAttribute("name", k);
    input.setAttribute("value", v);
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
var authTried = false;
function maybeAuthenticate() {
  if (authTried) {
    return;
  }
  authTried = true;
  const fragmentString = location.hash.substring(1);
  const params = {};
  const regex = /([^&=]+)=([^&]*)/g;
  let m = null;
  while ((m = regex.exec(fragmentString)) !== null) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }
  if (Object.keys(params).length > 0 && params["state"]) {
    const paramsJson = JSON.stringify(params);
    localStorage.setItem("oauth2-test-params", paramsJson);
  } else {
    oauthSignIn();
  }
}

// actions/drive/drive.js
var DOCS_API = "https://docs.googleapis.com/v1/documents/";
function documentToText(document2) {
  let documentText = "";
  documentText += document2.title + "<br><br>";
  for (const content of document2.body.content) {
    if (content.paragraph) {
      for (const element of content.paragraph.elements) {
        if (element.textRun.content) {
          documentText += element.textRun.content;
        }
      }
    }
  }
  return documentText;
}
async function fetchDocument(url) {
  const docsId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)[1];
  const docsApi = `${DOCS_API}${docsId}`;
  const params = JSON.parse(localStorage.getItem("oauth2-test-params"));
  const response = await fetch(`${docsApi}?access_token=${params["access_token"]}`);
  const documentData = await response.json();
  return documentData;
}
var docToText = async function* (chunks) {
  maybeAuthenticate();
  for await (const [k, c] of chunks) {
    if (k === "docUrl") {
      const document2 = await fetchDocument(chunkText(c));
      const documentText = documentToText(document2);
      yield ["docText", textChunk(documentText)];
    } else {
      yield [k, c];
    }
  }
};
export {
  Action,
  actions_exports as actions,
  async_exports as async,
  content_exports as content,
  sessions_exports as sessions
};
/**
 * @fileoverview Index export.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Utilities for processing content chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Library for working with lazy tree like stream of chunks.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Internal methods for the SDK.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Local session.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Generate content.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=aiae.js.map
