/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import dts from 'rollup-plugin-dts';

const config = [
  {
    input: './dist/index.d.ts',
    output: [{ file: './dist/aiae.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];

export default config;