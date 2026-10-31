#!/usr/bin/env node
/**
 * Regenerates the assignment data and replaces the Firebase Realtime Database
 * with it. `firebase deploy` runs this before uploading hosting, so a deploy
 * publishes both the site and a fresh database. Existing board edits are replaced.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const project = 'task-manager-f67c6';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(process.execPath, ['data-generator/generate-data.js']);
run(process.execPath, ['mock-server/build-db.mjs']);

const db = JSON.parse(readFileSync(resolve(root, 'mock-server/db.json'), 'utf8'));
const byId = (records) => Object.fromEntries(records.map((record) => [record.id, record]));
const state = {
  tasks: byId(db.tasks),
  users: byId(db.users),
  activities: byId(db.activities),
  statistics: db.statistics,
};

const seedFile = resolve(mkdtempSync(resolve(tmpdir(), 'task-manager-')), 'state.json');
writeFileSync(seedFile, JSON.stringify(state));

run('npx', [
  '-y',
  'firebase-tools',
  'database:set',
  '/',
  seedFile,
  '--project',
  project,
  '--force',
]);

console.log(`Firebase Realtime Database replaced: ${db.tasks.length} tasks`);
