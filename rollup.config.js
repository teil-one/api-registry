import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';

export default [
  {
    input: './build/index.js',
    output: {
      file: './lib/index.js',
      format: 'es'
    },
    plugins: [
      terser({
        ecma: 2020,
        mangle: true
      })
    ],
    external: ['rfc6570-uri-template']
  },
  {
    input: './build/index.js',
    output: {
      file: './lib/index.cjs',
      format: 'cjs'
    },
    plugins: [
      terser({
        ecma: 2020,
        mangle: true
      })
    ],
    external: ['rfc6570-uri-template']
  },
  {
    input: './build/index.d.ts',
    output: [{ file: './lib/index.d.ts', format: 'es' }],
    plugins: [dts()]
  }
];
