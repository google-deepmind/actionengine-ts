/**
 * @fileoverview Test.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import { parseMimetype, stringifyMimetype } from './mime.js';
import { Mimetype } from '../interfaces.js';

const mimetype = 'application/vnd.google.gdm.content+json';
const mimetypeObj: Mimetype = {
  type: 'application',
  subtype: 'content',
  prefix: 'vnd.google.gdm',
  suffix: 'json',
  parameters: undefined,
};

const mimetypeProto =
  'application/x-protobuf;type=deepmind.evergreen.v1.GenerationConfig';
const mimetypeProtoObj: Mimetype = {
  type: 'application',
  subtype: 'x-protobuf',
  parameters: {
    'type': 'deepmind.evergreen.v1.GenerationConfig',
  },
  prefix: undefined,
  suffix: undefined,
};

describe('parseMimetype', () => {
  it('parses a mimetype', () => {
    expect(parseMimetype(mimetype)).toEqual(mimetypeObj);
  });
  it('parses a protobuf mimetype', () => {
    expect(parseMimetype(mimetypeProto)).toEqual(mimetypeProtoObj);
  });
});

describe('stringifyMimetype', () => {
  it('stringifies a mimetype', () => {
    expect(stringifyMimetype(mimetypeObj)).toEqual(mimetype);
  });
  it('stringifies a protobuf mimetype', () => {
    expect(stringifyMimetype(mimetypeProtoObj)).toEqual(mimetypeProto);
  });
});
