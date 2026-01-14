#!/usr/bin/env node

import { spawnSync } from 'child_process';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env
  });

  process.exitCode = result.status ?? 1;
}

// In pre-release mode, changesets automatically handles the npm dist-tag
const args = ['changeset', 'publish'];

run('pnpm', args);

