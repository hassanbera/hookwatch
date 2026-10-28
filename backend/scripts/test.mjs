import 'dotenv/config';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const database = 'hookwatch_test_' + randomUUID().replaceAll('-', '');
// Identifiers are generated here, never accepted from a request or environment.
if (!/^[a-z0-9_]+$/.test(database)) throw new Error('Invalid temporary database name');
const connection = new URL(process.env.DATABASE_URL ?? '');
const admin = new pg.Client({
  connectionString: connection.toString(),
  connectionTimeoutMillis: 5000,
});
let created = false;
let exitCode = 1;
try {
  await admin.connect();
  await admin.query('CREATE DATABASE "' + database + '"');
  created = true;
  connection.pathname = '/' + database;
  const env = { ...process.env, DATABASE_URL: connection.toString(), WORKER_ENABLED: 'false' };
  const prisma = path.join(path.dirname(require.resolve('prisma/package.json')), 'build/index.js');
  const vitest = path.join(path.dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
  const migrated = spawnSync(process.execPath, [prisma, 'migrate', 'deploy'], {
    env,
    stdio: 'inherit',
  });
  if (migrated.error) throw migrated.error;
  if (migrated.status === 0) {
    const tested = spawnSync(process.execPath, [vitest, 'run'], { env, stdio: 'inherit' });
    if (tested.error) throw tested.error;
    exitCode = tested.status ?? 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  if (created) await admin.query('DROP DATABASE "' + database + '" WITH (FORCE)');
  await admin.end();
}
process.exitCode = exitCode;
