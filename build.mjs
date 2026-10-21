import { chmodSync } from 'node:fs';
import esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: 'build/index.mjs',
  format: 'esm',
  external: ['@modelcontextprotocol/sdk', 'zod'],
  banner: {
    js: '#!/usr/bin/env node',
  },
};

async function build() {
  try {
    if (isWatch) {
      const context = await esbuild.context(buildOptions);
      await context.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      chmodSync(buildOptions.outfile, 0o755);
      console.log('Build finished.');
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

build();
