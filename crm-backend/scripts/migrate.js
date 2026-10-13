// Applies supabase/migrations/*.sql in order, once each, recording them in schema_migrations.
// Usage: npm run migrate
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { sslOptions } from '../src/db/pool.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase', 'migrations');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: sslOptions({
    DATABASE_SSL: process.env.DATABASE_SSL || 'no-verify',
    DATABASE_SSL_CA_PATH: process.env.DATABASE_SSL_CA_PATH,
  }),
});

try {
  await client.connect();
  await client.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
    alter table public.schema_migrations enable row level security;
  `);
  const { rows } = await client.query('select filename from public.schema_migrations');
  const applied = new Set(rows.map((r) => r.filename));
  const pending = fs.readdirSync(dir).filter((f) => f.endsWith('.sql') && !applied.has(f)).sort();

  if (pending.length === 0) console.log('Database is up to date.');

  for (const file of pending) {
    process.stdout.write(`Applying ${file} ... `);
    await client.query('begin');
    try {
      await client.query(fs.readFileSync(path.join(dir, file), 'utf8'));
      await client.query('insert into public.schema_migrations (filename) values ($1)', [file]);
      await client.query('commit');
      console.log('done');
    } catch (err) {
      await client.query('rollback');
      console.log('failed');
      throw err;
    }
  }
} catch (err) {
  console.error(`Migration failed: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
