#!/usr/bin/env node
/**
 * Regenerates the assignment data and replaces the Firebase Realtime Database
 * with it. `firebase deploy` runs this before uploading hosting, so a deploy
 * publishes both the site and a fresh database. Existing board edits are replaced.
 *
 * Each collection is written with the Realtime Database REST API. `firebase database:set`
 * first calls the instance Admin API, and the GitHub Hosting service account does not
 * have `firebasedatabase.instances.get`. Rules grant write on each top-level path and
 * deny a write of the whole database root, so the collections are replaced one by one.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const databaseUrl = 'https://task-manager-f67c6-default-rtdb.firebaseio.com';

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

for (const [collection, value] of Object.entries(state)) {
  const response = await fetch(`${databaseUrl}/${collection}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error(`Failed to replace ${collection}: ${response.status} ${detail}`);
    process.exit(1);
  }
}

console.log(`Firebase Realtime Database replaced: ${db.tasks.length} tasks`);
