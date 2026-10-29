#!/usr/bin/env node
/**
 * Builds the json-server database (`mock-server/db.json`) from the assignment
 * data files in `data-generator/`.
 *
 * - `tasks` gets a numeric `order` so the board can persist drag & drop positions.
 * - `users` is derived from the unique task assignees.
 * - `activities` is seeded from the task timestamps so the feed is never empty.
 *
 * The generated file is a runtime artifact (json-server writes to it), so it is git-ignored.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(readFileSync(resolve(root, file), 'utf8'));

const { tasks: rawTasks } = readJson('data-generator/tasks.json');
const statistics = readJson('data-generator/statistics.json');

// Overdue tasks are seeded at the top of their column (as in the design); the rest keep file order.
const tasks = [...rawTasks]
  .sort((a, b) => Number(Boolean(b.isOverdue)) - Number(Boolean(a.isOverdue)))
  .map(({ isOverdue: _isOverdue, ...task }, index) => ({
    ...task,
    order: (index + 1) * 1000,
  }));

const users = [...new Map(tasks.map((task) => [task.assignee.id, task.assignee])).values()];

const activities = tasks
  .flatMap((task) => {
    const entries = [
      {
        id: `act-${task.id}-created`,
        type: 'created',
        taskId: task.id,
        taskTitle: task.title,
        actor: task.assignee.name,
        timestamp: task.createdAt,
      },
    ];
    if (task.completedAt) {
      entries.push({
        id: `act-${task.id}-completed`,
        type: 'completed',
        taskId: task.id,
        taskTitle: task.title,
        actor: task.assignee.name,
        timestamp: task.completedAt,
      });
    } else if (task.updatedAt !== task.createdAt) {
      entries.push({
        id: `act-${task.id}-updated`,
        type: 'updated',
        taskId: task.id,
        taskTitle: task.title,
        actor: task.assignee.name,
        timestamp: task.updatedAt,
      });
    }
    return entries;
  })
  .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

const db = { tasks, statistics, users, activities };
writeFileSync(resolve(root, 'mock-server/db.json'), `${JSON.stringify(db, null, 2)}\n`);

console.log(
  `mock-server/db.json written: ${tasks.length} tasks, ${users.length} users, ${activities.length} activities`,
);
