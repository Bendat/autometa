#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

function readPreTag(cwd) {
  const prePath = path.join(cwd, '.changeset', 'pre.json');
  if (!fs.existsSync(prePath)) return null;

  const preState = JSON.parse(fs.readFileSync(prePath, 'utf8'));
  if (preState?.mode !== 'pre') return null;
  if (typeof preState?.tag !== 'string' || preState.tag.length === 0) return null;

  return preState.tag;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env
  });

  process.exitCode = result.status ?? 1;
}

const cwd = process.cwd();
const preTag = readPreTag(cwd);

const args = ['changeset', 'publish'];
if (preTag) args.push('--tag', preTag);

run('pnpm', args);

