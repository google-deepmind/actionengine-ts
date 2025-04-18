/**
 * @fileoverview Test.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'jasmine';

import { isProtoMessage } from './content.js';
import { Mimetype } from '../interfaces.js';

const mimetypeObj: Mimetype = {
  type: 'application',
  subtype: 'content',
  prefix: 'vnd.google.gdm',
  suffix: 'json',
  parameters: undefined,
};

const mimetypeProtoObj: Mimetype = {
  type: 'application',
  subtype: 'x-protobuf',
  parameters: {
    'type': 'deepmind.evergreen.v1.GenerationConfig',
  },
  prefix: undefined,
  suffix: undefined,
};


describe('isProtoMessage', () => {
  it('returns true if mimetype matches proto message', () => {
    expect(
      isProtoMessage(
        mimetypeProtoObj,
        'deepmind.evergreen.v1.GenerationConfig',
      ),
    ).toBeTrue();
  });

  it('returns false if mimetype is does not match proto message', () => {
    expect(
      isProtoMessage(mimetypeObj, 'deepmind.evergreen.v1.NotThis'),
    ).toBeFalse();
  });
});
