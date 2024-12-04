import typescript from '@rollup/plugin-typescript';
import { sourceMapsEnabled } from 'process';
import { sentryRollupPlugin } from "@sentry/rollup-plugin";

export default {
  input: 'src/main.ts',  // Path to your main TypeScript file
  output: {
    file: 'dist/bundle.js',  // Output file
    format: 'es',       // Output format (es, cjs, iife, etc.)
    sourcemap: true, // Source map generation must be turned on
  },
  plugins: [typescript(
    { sourceMap: sourceMapsEnabled, inlineSourceMap: true },  // Enable source maps
  )],
};
