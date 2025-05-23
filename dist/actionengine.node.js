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

// interfaces.ts
var Action = class {
};

// content/index.ts
var content_exports = {};
__export(content_exports, {
  JSON_MIME_TYPE: () => JSON_MIME_TYPE,
  ROLE: () => ROLE,
  TEXT_MIME_TYPE: () => TEXT_MIME_TYPE,
  assistantPrompt: () => assistantPrompt,
  audioChunk: () => audioChunk,
  audioChunksToMediaStream: () => audioChunksToMediaStream,
  blobChunk: () => blobChunk,
  chunkBlob: () => chunkBlob,
  chunkJson: () => chunkJson,
  chunkText: () => chunkText,
  contextPrompt: () => contextPrompt,
  dataUrlFromBlob: () => dataUrlFromBlob,
  fetchChunk: () => fetchChunk,
  imageChunk: () => imageChunk,
  imageChunksToMediaStream: () => imageChunksToMediaStream,
  isChunk: () => isChunk,
  isDataChunk: () => isDataChunk,
  isJsonChunk: () => isJsonChunk,
  isProtoMessage: () => isProtoMessage,
  isRefChunk: () => isRefChunk,
  isTextChunk: () => isTextChunk,
  jsonChunk: () => jsonChunk,
  mediaStreamToAudioChunks: () => mediaStreamToAudioChunks,
  mediaStreamToImageChunks: () => mediaStreamToImageChunks,
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

// content/mime.ts
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
      result += `;${key}=${value}`;
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

// content/content.ts
var ROLE = /* @__PURE__ */ ((ROLE2) => {
  ROLE2["USER"] = "USER";
  ROLE2["ASSISTANT"] = "ASSISTANT";
  ROLE2["SYSTEM"] = "SYSTEM";
  ROLE2["CONTEXT"] = "CONTEXT";
  return ROLE2;
})(ROLE || {});
function isTextChunk(maybeChunk) {
  return maybeChunk.metadata?.mimetype?.type === "text";
}
function isJsonChunk(maybeChunk) {
  const chunk = maybeChunk;
  const mimetype = chunk.metadata?.mimetype;
  return mimetype?.type === "application" && mimetype.subtype === "json";
}
function isRefChunk(maybeChunk) {
  return maybeChunk.ref !== void 0;
}
function isDataChunk(maybeChunk) {
  return maybeChunk.data !== void 0;
}
function isChunk(maybeChunk) {
  const c = maybeChunk;
  return !!(c.metadata ?? c.data ?? c.ref);
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
        ...metadata.mimetype,
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
        ...metadata.mimetype,
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
    throw new Error(`Unsupported chunk type: ${JSON.stringify(chunk)}`);
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
      image.addEventListener(
        "load",
        () => {
          resolve();
        },
        { once: true }
      );
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
function dataUrlFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = function() {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error(`result type ${typeof reader.result}`));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

// stream/index.ts
var stream_exports = {};
__export(stream_exports, {
  awaitableAsyncIterable: () => awaitableAsyncIterable,
  createStream: () => createStream,
  isAsyncIterable: () => isAsyncIterable,
  thenableAsyncIterable: () => thenableAsyncIterable
});

// stream/stream.ts
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
    return Promise.resolve();
  }
  /**
   * Write and close.
   */
  async writeAndClose(value) {
    await this.write(value);
    await this.close();
  }
  /**
   * Closes the stream.
   */
  close() {
    this.closed = true;
    for (const iterator of [...this.iterators]) {
      iterator.close();
    }
    return Promise.resolve();
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
    if (result.done) break;
    yield result.value;
  }
}
var StreamIterator = class {
  constructor(stream, current, done) {
    this.stream = stream;
    this.done = done;
    this.writeQueue = [...current];
  }
  writeQueue = [];
  readQueue = [];
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
      return Promise.reject(new Error(this.stream.getError()));
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
function awaitableAsyncIterable(iter) {
  const then = iter;
  then.then = thenableAsyncIterable;
  return then;
}

// content/prompt.ts
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
    value.then(async (v) => {
      if (isChunk(v)) {
        if (metadataFn) {
          v = withMetadata(v, metadataFn(v));
        }
      } else {
        v = transformToContent(v, metadataFn);
      }
      await pl.write(v);
      await pl.close();
    }).catch((err) => {
      pl.error(`${err}`);
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
      value ??= "";
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
var userPrompt = promptLiteralWithMetadata(() => ({ role: "USER" /* USER */ }));
var systemPrompt = promptLiteralWithMetadata(() => ({
  role: "SYSTEM" /* SYSTEM */
}));
var assistantPrompt = promptLiteralWithMetadata(() => ({
  role: "ASSISTANT" /* ASSISTANT */
}));
var contextPrompt = promptLiteralWithMetadata(() => ({
  role: "CONTEXT" /* CONTEXT */
}));
function promptWithMetadata(prompt3, metadata) {
  if (isChunk(prompt3)) {
    const chunk = withMetadata(prompt3, metadata);
    return chunk;
  } else if (prompt3 instanceof Array) {
    const list = prompt3.map(
      (child) => promptWithMetadata(child, metadata)
    );
    return list;
  } else if (isAsyncIterable(prompt3)) {
    const pipe = createStream();
    const source = prompt3;
    const transform = async () => {
      try {
        for await (const item of source) {
          void pipe.write(promptWithMetadata(item, metadata));
        }
      } catch (err) {
        pipe.error(`${err}`);
      } finally {
        await pipe.close();
      }
    };
    void transform();
    return pipe;
  }
  throw new Error(`Unsupported type ${prompt3}`);
}

// content/audio.ts
var DEFAULT_OUTPUT_SAMPLE_RATE = 24e3;
var DEFAULT_INPUT_SAMPLE_RATE = 16e3;
var DEFAULT_NUM_CHANNELS = 1;
async function decodeAudioData(chunk, ctx, sampleRate, numChannels) {
  const data = chunk.data;
  if (!data) {
    throw new Error("Chunk without data.");
  }
  const buffer = ctx.createBuffer(numChannels, data.length / 2 / numChannels, sampleRate);
  const mimetype = chunk.metadata?.mimetype;
  if (!mimetype) {
    throw new Error("Chunk without mimetype.");
  }
  if (mimetype.type === "audio" && mimetype.subtype === "ogg") {
    const blob = new Blob([data.buffer], { type: "audio/ogg" });
    const oggBuffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    for (let i = 0; i < numChannels; i++) {
      buffer.copyToChannel(oggBuffer.getChannelData(i), i);
    }
  } else if (mimetype.type === "audio" && mimetype.subtype === "pcm") {
    const dataInt16 = new Int16Array(data.buffer);
    const l = dataInt16.length;
    const dataFloat32 = new Float32Array(l);
    for (let i = 0; i < l; i++) {
      dataFloat32[i] = dataInt16[i] / 32768;
    }
    if (numChannels === 0) {
      buffer.copyToChannel(dataFloat32, 0);
    } else {
      for (let i = 0; i < numChannels; i++) {
        const channel = dataFloat32.filter(
          (_, index) => index % numChannels === i
        );
        buffer.copyToChannel(channel, i);
      }
    }
  } else {
    throw new Error(`Unsupported mime type: ${JSON.stringify(mimetype)}`);
  }
  return buffer;
}
function audioChunksToMediaStream(chunks) {
  const sampleRate = DEFAULT_OUTPUT_SAMPLE_RATE;
  const numChannels = DEFAULT_NUM_CHANNELS;
  const media = new MediaStream();
  function nextContext(currentCtx) {
    if (currentCtx) {
      void currentCtx.close();
    }
    const nextCtx = new AudioContext({ sampleRate });
    const nextDest = nextCtx.createMediaStreamDestination();
    media.getTracks().forEach((t) => {
      media.removeTrack(t);
    });
    nextDest.stream.getTracks().forEach((t) => {
      media.addTrack(t);
    });
    return [nextCtx, nextDest];
  }
  ;
  let [ctx, dest] = nextContext();
  async function read() {
    try {
      let nextStartTime = 0;
      for await (const chunk of chunks) {
        if (chunk.metadata?.mimetype?.type !== "audio") {
          continue;
        }
        const mimetypeParameters = chunk.metadata.mimetype.parameters;
        let chunkSampleRate = Number(mimetypeParameters?.["rate"]);
        if (isNaN(chunkSampleRate)) {
          chunkSampleRate = sampleRate;
        }
        if (ctx.currentTime > nextStartTime) {
          [ctx, dest] = nextContext(ctx);
          nextStartTime = ctx.currentTime;
        }
        let audioBuffer;
        try {
          audioBuffer = await decodeAudioData(chunk, ctx, sampleRate, numChannels);
        } catch (e) {
          console.error("Error decoding audio data", e);
          continue;
        }
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(dest);
        source.start(nextStartTime);
        nextStartTime = nextStartTime + audioBuffer.duration;
      }
      await ctx.close();
    } finally {
      if (ctx.state !== "closed") {
        void ctx.close();
      }
    }
  }
  void read();
  return media;
}
async function* mediaStreamToAudioChunks(media) {
  const sampleRate = DEFAULT_INPUT_SAMPLE_RATE;
  const ctx = new AudioContext({ sampleRate });
  const numChannels = DEFAULT_NUM_CHANNELS;
  const src = ctx.createMediaStreamSource(media);
  const BUFFER_SIZE = 8192;
  const processor = ctx.createScriptProcessor(
    BUFFER_SIZE,
    numChannels,
    numChannels
  );
  const queue = [];
  let resolver = void 0;
  processor.onaudioprocess = (e) => {
    const data = e.inputBuffer.getChannelData(0);
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    const chunk = {
      data: new Uint8Array(int16.buffer),
      metadata: {
        mimetype: {
          type: "audio",
          subtype: "pcm",
          parameters: { "rate": `${sampleRate}` }
        }
      }
    };
    if (resolver) {
      resolver(chunk);
      resolver = void 0;
    } else {
      queue.push(chunk);
    }
  };
  src.connect(processor);
  processor.connect(ctx.destination);
  try {
    while (true) {
      if (queue.length > 0) {
        const result = queue.shift();
        if (result === void 0) {
          continue;
        }
        yield result;
      } else {
        const result = await new Promise((resolve) => {
          resolver = resolve;
        });
        yield result;
      }
      if (!media.active) {
        break;
      }
    }
  } finally {
    await ctx.close();
  }
}

// content/video.ts
function imageChunksToMediaStream(chunks, options) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  let first = true;
  async function read() {
    try {
      for await (const c of chunks) {
        if (c.metadata?.mimetype?.type !== "image") {
          continue;
        }
        const img = new Image();
        if (c.data) {
          img.src = await dataUrlFromBlob(new Blob([c.data], { type: stringifyMimetype(c.metadata?.mimetype) }));
        } else {
          throw new Error(`Not yet implemented ${JSON.stringify(c)}`);
        }
        if (first) {
          first = false;
          canvas.width = img.width;
          canvas.height = img.height;
          console.log(canvas.width, canvas.height);
        }
        ctx?.drawImage(img, 0, 0);
      }
    } finally {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }
  void read();
  const stream = canvas.captureStream(options?.frameRate);
  return stream;
}
var mediaToImageOptions = { frameRate: 1, scale: 0.5 };
async function* mediaStreamToImageChunks(media, options = {}) {
  const opts = { ...mediaToImageOptions, ...options };
  const video = document.createElement("video");
  video.srcObject = media;
  video.autoplay = true;
  video.muted = true;
  await video.play();
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth * opts.scale;
  canvas.height = video.videoHeight * opts.scale;
  const ctx = canvas.getContext("2d");
  while (true) {
    if (!media.active) {
      break;
    }
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 1);
    yield await fetchChunk(fetch(dataUrl));
    await new Promise((resolve) => {
      setTimeout(resolve, 1e3 / opts.frameRate);
    });
  }
}

// sessions/index.ts
var sessions_exports = {};
__export(sessions_exports, {
  local: () => local,
  middleware: () => middleware_exports,
  sessionProvider: () => sessionProvider
});

// async/index.ts
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

// sessions/utils.ts
var uniqueIdCounter = 1;
function uniqueId() {
  return `${uniqueIdCounter++}`;
}

// sessions/session.ts
var SessionPipe = class {
  constructor(context) {
    this.context = context;
  }
  id = uniqueId();
  seq = 0;
  closed = false;
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
  constructor(context) {
    this.context = context;
  }
  createPipe(content) {
    const pipe = new SessionPipe(this.context);
    if (content) {
      void pipe.writeAndClose(content);
    }
    return pipe;
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
    void outputs[k].write(c);
  }
  for (const v of Object.values(outputs)) {
    await v.close();
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

// sessions/local.ts
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
    pl ??= this.createStream(id);
    const lastSeq = this.sequenceOrder.get(id);
    if (lastSeq === void 0) {
      throw new Error(`Sequence not found for ${id}`);
    }
    const seq = options?.seq ?? 0;
    if (lastSeq + 1 !== seq) {
      throw new Error(`Out of order sequence writes not yet supported. last seq ${lastSeq}, current seq ${seq}`);
    }
    this.sequenceOrder.set(id, seq);
    if (chunk.data !== void 0 || chunk.ref !== void 0) {
      await pl.write(chunk);
    }
    const continued = options?.continued ?? false;
    if (!continued) {
      await pl.close();
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
    pl ??= this.createStream(id);
    return pl;
  }
  async close() {
    for (const stream of this.nodeMap.values()) {
      await stream.close();
    }
    this.nodeMap.clear();
    this.sequenceOrder.clear();
  }
};
var local = sessionProvider(() => new LocalContext());

// sessions/middleware/index.ts
var middleware_exports = {};
__export(middleware_exports, {
  debug: () => debug
});

// sessions/middleware/debug.ts
var DebugContext = class {
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

// actions/index.ts
var actions_exports = {};
__export(actions_exports, {
  GenerateContent: () => GenerateContent,
  Live: () => Live,
  ReverseContent: () => ReverseContent,
  drive: () => drive_exports,
  evergreen: () => evergreen_exports,
  google: () => google_exports
});

// actions/common.ts
var GenerateContent = class extends Action {
};
var Live = class extends Action {
};

// actions/toy.ts
var ReverseContent = class extends Action {
  async run(session, inputs, outputs) {
    for await (const chunk of inputs.prompt) {
      const text = chunkText(chunk);
      const reverse = text.split("").reverse().join("");
      await outputs.response.write(textChunk(reverse, { role: "ASSISTANT" /* ASSISTANT */ }));
    }
    await outputs.response.close();
  }
};

// actions/google/index.ts
var google_exports = {};
__export(google_exports, {
  genai: () => genai_exports
});

// actions/google/genai.ts
var genai_exports = {};
__export(genai_exports, {
  GenerateContent: () => GenerateContent2,
  Live: () => Live2
});
import { GoogleGenAI, Modality } from "@google/genai";

// base64/index.ts
var base64_exports = {};
__export(base64_exports, {
  decode: () => decode,
  encode: () => encode
});
function encode(bytes) {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// actions/google/genai.ts
var clients = /* @__PURE__ */ new Map();
function genAI(apiKey) {
  let client = clients.get(apiKey);
  if (!client) {
    client = new GoogleGenAI({ apiKey, apiVersion: "v1alpha" });
    clients.set(apiKey, client);
  }
  return client;
}
var Live2 = class extends Live {
  constructor(apiKey, model = "gemini-2.0-flash-exp") {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }
  async run(session, inputs, outputs) {
    const client = genAI(this.apiKey);
    const config = {
      responseModalities: [Modality.AUDIO]
    };
    if (inputs.system) {
      const system = await inputs.system;
      const systemString = system.map((c) => chunkText(c)).join("");
      config.systemInstruction = {
        parts: [{ text: systemString }]
      };
    }
    const live = await client.live.connect({
      model: this.model,
      config,
      callbacks: {
        onmessage: (e) => {
          void onmessage(e);
        },
        onerror: (e) => {
          console.log("error", e);
        },
        onclose: (e) => {
          console.log("close", e);
        },
        onopen: () => {
          console.log("open");
        }
      }
    });
    async function readInputs() {
      const arr = [inputs.audio, inputs.video, inputs.screen].filter((x) => !!x);
      if (arr.length === 0) return;
      for await (const chunk of merge(...arr)) {
        if (chunk.data) {
          live.sendRealtimeInput({
            media: {
              mimeType: stringifyMimetype(chunk.metadata.mimetype),
              data: encode(chunk.data)
            }
          });
        }
      }
    }
    async function readContext() {
      if (!inputs.context) {
        return;
      }
      for await (const chunk of inputs.context) {
        if (chunk.data) {
          live.sendClientContent({
            turns: [{
              parts: [{
                text: chunkText(chunk)
              }]
            }],
            turnComplete: false
          });
        }
      }
    }
    async function onmessage(resp) {
      if (resp.serverContent?.modelTurn) {
        const turn = resp.serverContent.modelTurn;
        if (turn.parts) {
          for (const part of turn.parts) {
            if (part.text) {
              const chunk = textChunk(part.text);
              await outputs.context?.write(chunk);
            } else if (part.inlineData) {
              const chunk = {
                data: decode(part.inlineData.data ?? ""),
                metadata: {
                  mimetype: parseMimetype(part.inlineData.mimeType)
                }
              };
              if (chunk.metadata?.mimetype?.type === "audio") {
                await outputs.audio?.write(chunk);
              } else {
                await outputs.context?.write(chunk);
              }
            }
          }
        }
      }
      if (resp.serverContent?.turnComplete) {
        console.log("complete turn");
        return;
      }
      if (resp.serverContent?.interrupted) {
        console.log("interupted turn");
        return;
      }
      if (resp.toolCall) {
        console.log("toolCall");
        return;
      }
      if (resp.toolCallCancellation) {
        console.log("toolCancellation");
        return;
      }
    }
    async function writeOutputs2() {
      await new Promise(() => {
      });
    }
    void readInputs();
    void readContext();
    await writeOutputs2();
  }
};
var GenerateContent2 = class extends GenerateContent {
  constructor(apiKey, model) {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }
  async run(session, inputs, outputs) {
    if (!outputs.response) {
      return;
    }
    const prompt3 = await inputs.prompt;
    const promptString = prompt3.map((c) => chunkText(c)).join("");
    const response = await genAI(this.apiKey).models.generateContentStream({
      model: this.model,
      contents: promptString
    });
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        await outputs.response.write(textChunk(text));
      }
    }
  }
};

// actions/drive/index.ts
var drive_exports = {};
__export(drive_exports, {
  docToText: () => docToText
});

// actions/drive/auth.ts
var OAUTH_CLIENT_ID = "";
var OAUTH_SCOPES = ["https://www.googleapis.com/auth/documents.readonly"];
function oauthSignIn() {
  const oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";
  const form = document.createElement("form");
  form.setAttribute("method", "GET");
  form.setAttribute("action", oauth2Endpoint);
  if (!OAUTH_CLIENT_ID) {
    OAUTH_CLIENT_ID = prompt("Google OAuth client") ?? "";
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

// actions/drive/drive.ts
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
  const match = /\/d\/([a-zA-Z0-9-_]+)/.exec(url);
  if (!match) {
    throw new Error(`Bad url ${url}`);
  }
  const docsId = match[1];
  const docsApi = `${DOCS_API}${docsId}`;
  const params = JSON.parse(localStorage.getItem("oauth2-test-params") ?? "{}");
  const response = await fetch(
    `${docsApi}?access_token=${params.access_token}`
  );
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

// actions/evergreen/index.ts
var evergreen_exports = {};
__export(evergreen_exports, {
  AbstractBaseConnectionManager: () => AbstractBaseConnectionManager,
  CachingConnectionManagerFactory: () => CachingConnectionManagerFactory,
  GENERATE: () => GENERATE,
  Options: () => Options,
  action: () => action,
  setBackend: () => setBackend
});

// actions/evergreen/actions.ts
var GENERATE = {
  name: "GENERATE",
  inputs: [
    {
      name: "prompt",
      description: "The prompt to generate from",
      type: [
        { type: "text", subtype: "plain" },
        { type: "image", subtype: "png" }
      ]
    }
  ],
  outputs: [
    {
      name: "response",
      description: "The response from the model",
      type: [
        { type: "text", subtype: "plain" },
        { type: "image", subtype: "png" }
      ]
    }
  ]
};

// actions/evergreen/net.ts
var AbstractBaseConnectionManager = class {
  callbacks = [];
  /**
   * Method defined in interface. Registers the provided `callback` in an
   * internal array of callbacks. Each callback will be invoked when a new
   * `SessionMessage` is received from the remote server.
   */
  registerSessionMessageCallback(callback) {
    this.callbacks.push(callback);
  }
  /**
   * Default implementation of the `onServerResponse` method. This method
   * converts the raw server response into a `SessionMessage` object and emits
   * it via the registered callbacks. Implementers must provide their
   * own concrete implementation of the `convertServerResponseToSessionMessage`
   * method below.
   */
  async onServerResponse(event) {
    const message = await this.convertServerResponseToSessionMessage(event);
    if (message) {
      for (const callback of this.callbacks) {
        callback(message);
      }
    }
  }
};
function WebSocketConnectionManagerFactoryFn(backendUrl) {
  return WebSocketConnectionManager.createWithUrl(backendUrl);
}
var WebSocketConnectionManager = class _WebSocketConnectionManager extends AbstractBaseConnectionManager {
  socket;
  constructor(backendUrl, socket) {
    super();
    if (backendUrl) {
      this.socket = new WebSocket(backendUrl);
    } else if (socket) {
      this.socket = socket;
    } else {
      throw new Error("Either backendUrl or socket must be provided.");
    }
    this.socket.binaryType = "blob";
  }
  static createWithUrl(backendUrl) {
    return new _WebSocketConnectionManager(backendUrl);
  }
  static createWithSocket(socket) {
    return new _WebSocketConnectionManager(void 0, socket);
  }
  isValidConnection() {
    return this.socket.readyState === WebSocket.OPEN;
  }
  async connect() {
    if (this.isValidConnection()) {
      console.info("WebSocket already connected");
      return;
    }
    await new Promise((resolve, reject) => {
      this.socket.addEventListener("open", () => {
        this.socket.removeEventListener("error", reject);
        this.socket.removeEventListener("close", reject);
        resolve();
      });
      this.socket.addEventListener("error", reject);
      this.socket.addEventListener("close", reject);
    });
    this.socket.onmessage = async (event) => {
      await this.onServerResponse(event);
    };
    this.socket.onerror = (event) => {
      this.onError(event);
    };
    this.socket.onclose = (event) => {
      this.onClose(event);
    };
  }
  disconnect() {
    this.socket.close();
  }
  send(message) {
    this.socket.send(JSON.stringify(message));
  }
  async convertServerResponseToSessionMessage(event) {
    let message;
    switch (event.type) {
      case "text":
      case "message":
      case "binary":
        const data = event.data;
        if (data instanceof Blob) {
          const buf = await data.arrayBuffer();
          message = JSON.parse(
            new TextDecoder().decode(new Uint8Array(buf))
          );
        } else if (data instanceof ArrayBuffer) {
          message = JSON.parse(
            new TextDecoder().decode(new Uint8Array(data))
          );
        } else if (typeof data === "string") {
          message = JSON.parse(data);
        } else {
          throw new Error(
            `Unsupported type ${this.socket.binaryType} ${typeof data}`
          );
        }
        break;
      default:
        throw new Error(`Unknown message type ${event.type}`);
    }
    return message;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onError(event) {
    console.info("Websocket error", event, this.socket);
  }
  onClose(event) {
    console.info(
      `Websocket closed: ${event.reason} ${event.code}`,
      event,
      this.socket
    );
  }
};
var CachingConnectionManagerFactory = class {
  connectionMap = /* @__PURE__ */ new Map();
  createManagerFn;
  constructor(createManagerFn) {
    this.createManagerFn = createManagerFn;
  }
  getConnection(session, backendUrl) {
    let manager = this.connectionMap.get(session);
    if (manager) {
      if (manager.isValidConnection()) {
        return manager;
      } else {
        manager = void 0;
        this.connectionMap.delete(session);
      }
    }
    manager = this.createManagerFn(backendUrl);
    this.connectionMap.set(session, manager);
    return manager;
  }
};

// actions/evergreen/run.ts
var UuidStreamIdGenerator = class {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generateStreamId(streamName) {
    return crypto.randomUUID();
  }
};
var Options = class {
  constructor(backend, idGenerator, connectionFactory) {
    this.backend = backend;
    this.idGenerator = idGenerator;
    this.connectionFactory = connectionFactory;
  }
};
function getUuids(inputs, outputs, idGenerator) {
  const outputIds = {};
  for (const outputKey of Object.keys(outputs)) {
    outputIds[outputKey] = idGenerator.generateStreamId(outputKey);
  }
  const inputIds = {};
  for (const inputKey of Object.keys(inputs)) {
    inputIds[inputKey] = idGenerator.generateStreamId(inputKey);
  }
  return [inputIds, outputIds];
}
async function writeToOutputs(msg, outputIds, outputs, childIdMapping, pending) {
  for (const nodeFragment of msg.nodeFragments ?? []) {
    const key = nodeFragment.id;
    if (!key) {
      console.warn("nodeFragment missing id");
      continue;
    }
    if (nodeFragment.childIds) {
      for (const childId of nodeFragment.childIds) {
        childIdMapping[childId] = childIdMapping[key];
        const existing = pending[childId];
        if (existing) {
          const copy = [...existing];
          delete pending[childId];
          for (const existingNodeFragment of copy) {
            await writeToOutputs(
              { nodeFragments: [existingNodeFragment] },
              outputIds,
              outputs,
              childIdMapping,
              pending
            );
          }
        }
      }
      const streamKey2 = childIdMapping[key];
      const stream2 = outputs[streamKey2];
      if (stream2 && !nodeFragment.continued && outputIds[key]) {
        await stream2.close();
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
    const stream = outputs[streamKey];
    const metadata = {
      mimetype: parseMimetype(nodeFragment.chunkFragment?.metadata?.mimetype),
      role: nodeFragment.chunkFragment?.metadata?.role
    };
    const data = nodeFragment.chunkFragment?.data ? decode(nodeFragment.chunkFragment.data) : void 0;
    const ref = nodeFragment.chunkFragment?.ref;
    const chunk = data ? { metadata, data } : ref ? { metadata, ref } : { metadata };
    await stream.write(chunk);
    if (!nodeFragment.continued && outputIds[key]) {
      await stream.close();
    }
  }
}
function sendAction(connectionManager, uri, action2, inputIds, outputIds) {
  const actionMessage = {
    actions: [
      {
        targetSpec: {
          id: uri
        },
        name: action2.name,
        inputs: Object.keys(inputIds).map((input) => {
          return {
            name: input,
            id: inputIds[input]
          };
        }),
        outputs: Object.keys(outputIds).map((output) => {
          return {
            name: output,
            id: outputIds[output]
          };
        })
      }
    ]
  };
  connectionManager.send(actionMessage);
}
function sendInput(connectionManager, inputs, inputIds) {
  for (const [k, v] of Object.entries(inputs)) {
    void (async (key, stream) => {
      let seq = 0;
      for await (const chunk of stream) {
        const chunkFragment = {};
        chunkFragment.metadata = {
          mimetype: stringifyMimetype(chunk.metadata?.mimetype),
          role: chunk.metadata?.role
        };
        if (chunk.data) {
          chunkFragment.data = encode(chunk.data);
        }
        const dataMsg = {
          nodeFragments: [
            {
              id: inputIds[key],
              chunkFragment,
              seq: seq++,
              continued: true
            }
          ]
        };
        connectionManager.send(dataMsg);
      }
      const closeMsg = {
        nodeFragments: [
          {
            id: inputIds[key],
            seq: seq++,
            continued: false
          }
        ]
      };
      connectionManager.send(closeMsg);
    })(k, v);
  }
}
async function runEvergreenAction(session, uri, action2, inputs, outputs, options) {
  const connectionManager = options.connectionFactory.getConnection(
    session,
    options.backend
  );
  await connectionManager.connect();
  const [inputIds, outputIds] = getUuids(inputs, outputs, options.idGenerator);
  const childIdMapping = {};
  for (const output of Object.keys(outputIds)) {
    childIdMapping[outputIds[output]] = output;
  }
  const pending = {};
  connectionManager.registerSessionMessageCallback((msg) => {
    void writeToOutputs(msg, outputIds, outputs, childIdMapping, pending);
  });
  sendAction(connectionManager, uri, action2, inputIds, outputIds);
  sendInput(connectionManager, inputs, inputIds);
}
var EvergreenAction = class extends Action {
  constructor(uri, action2, options) {
    super();
    this.uri = uri;
    this.action = action2;
    this.options = options;
  }
  async run(session, inputs, outputs) {
    await runEvergreenAction(
      session,
      this.uri,
      this.action,
      inputs,
      outputs,
      this.options
    );
  }
};
var defaultConnectionFactory = new CachingConnectionManagerFactory(WebSocketConnectionManagerFactoryFn);
var lazyBackend = void 0;
function setBackend(address) {
  lazyBackend = address;
}
function getBackend() {
  if (lazyBackend === void 0) {
    throw new Error("No backend address set, call setBackend().");
  }
  return lazyBackend;
}
function action(uri, action2, options) {
  options ??= new Options(
    getBackend(),
    new UuidStreamIdGenerator(),
    defaultConnectionFactory
  );
  return new EvergreenAction(uri, action2, options);
}
export {
  Action,
  actions_exports as actions,
  async_exports as async,
  base64_exports as base64,
  content_exports as content,
  sessions_exports as sessions,
  stream_exports as stream
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
/** 
 * @fileoverview base64 helper utilities.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Evergreen actions.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Evergreen interfaces.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Abstractions for the network layer required to execute
 * Evergreen actions on remote servers from a web browser client. As well as
 * a default implementation that uses WebSockets for network transport.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Evergreen.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=actionengine.js.map
