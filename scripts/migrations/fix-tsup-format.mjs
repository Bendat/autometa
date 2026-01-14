#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

async function main() {
  const tsupFiles = await glob('packages/*/tsup.config.ts', {
    cwd: repoRoot,
    absolute: true
  });

  for (const file of tsupFiles) {
    let content = fs.readFileSync(file, 'utf8');

    const updated = content
      .replace(/\n\s*tsconfig: "\.\/tsconfig\.build\.json",/g, '\n  tsconfig: "./tsconfig.build.json",')
      .replace(/\n(\s*)dts:/g, '\n  dts:')
      .replace(/\n(\s*)external:/g, '\n  external:');

    if (updated !== content) {
      fs.writeFileSync(file, updated);
    }
  }

  console.log('✅ Normalised tsup config formatting');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
