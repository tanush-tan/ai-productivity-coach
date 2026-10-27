/**
 * migrate.js — Database migration runner for AI Productivity Coach
 *
 * Responsibilities:
 *   1. Bootstrap the schema_migrations tracking table (idempotent, CREATE IF NOT EXISTS).
 *   2. Read all *.sql files from src/migrations/, sorted by version prefix.
 *   3. Skip migrations already recorded in schema_migrations.
 *   4. Apply new migrations inside individual transactions so a partial
 *      failure rolls back cleanly and the version is never recorded.
 *   5. Support a --status flag that lists applied/pending migrations
 *      without executing any SQL changes.
 *
 * Usage:
 *   node src/migrate.js            — apply all pending migrations
 *   node src/migrate.js --status   — print status without applying anything
 *
 * The DATABASE_URL environment variable must be set (loaded from .env).
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// ---------------------------------------------------------------------------
// Resolve paths (ESM __dirname equivalent)
// ---------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// ---------------------------------------------------------------------------
// Bootstrap SQL — creates the tracking table if it does not exist.
// This is the ONLY place schema_migrations is ever created.
// Running it multiple times (on subsequent deploys) is safe because of
// IF NOT EXISTS.
// ---------------------------------------------------------------------------
const BOOTSTRAP_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    TEXT        PRIMARY KEY,
    name       TEXT        NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the numeric version prefix and the descriptive name from a
 * migration filename.
 *
 * Examples:
 *   "001_initial_schema.sql"  → { version: '001', name: 'initial_schema' }
 *   "002_add_refresh_tokens.sql" → { version: '002', name: 'add_refresh_tokens' }
 *
 * Files that do not match the pattern are ignored (e.g. README.md).
 */
function parseMigrationFilename(filename) {
  const match = filename.match(/^(\d+)_(.+)\.sql$/);
  if (!match) return null;
  return { version: match[1], name: match[2] };
}

/**
 * Read and sort all valid migration files from MIGRATIONS_DIR.
 * Returns an array of { version, name, filepath } objects.
 */
function loadMigrationFiles() {
  let entries;
  try {
    entries = fs.readdirSync(MIGRATIONS_DIR);
  } catch {
    console.error(`[migrate] Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  return entries
    .map((filename) => {
      const parsed = parseMigrationFilename(filename);
      if (!parsed) return null;
      return {
        ...parsed,
        filepath: path.join(MIGRATIONS_DIR, filename),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.version.localeCompare(b.version));
}

/**
 * Fetch the set of already-applied version strings from schema_migrations.
 */
async function getAppliedVersions(client) {
  const result = await client.query(
    'SELECT version FROM schema_migrations ORDER BY version;'
  );
  return new Set(result.rows.map((r) => r.version));
}

// ---------------------------------------------------------------------------
// --status mode: genuinely read-only — never creates or modifies any table.
//
// On a fresh database where schema_migrations does not yet exist:
//   - A catalog query (information_schema.tables) checks existence.
//   - All migration files are reported as pending without touching the DB.
// On an initialised database:
//   - schema_migrations is queried normally and applied/pending are listed.
// ---------------------------------------------------------------------------
async function runStatus(client) {
  const migrations = loadMigrationFiles();

  // Read-only catalog query: does schema_migrations exist in this database?
  const catalogResult = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM   information_schema.tables
      WHERE  table_schema = 'public'
      AND    table_name   = 'schema_migrations'
    ) AS exists;
  `);
  const tableExists = catalogResult.rows[0].exists;

  if (migrations.length === 0) {
    console.log('[migrate] No migration files found.');
    return;
  }

  console.log('\n[migrate] Migration status:\n');

  if (!tableExists) {
    // schema_migrations has never been created — every migration is pending.
    // Do NOT create the table; that is the responsibility of `npm run migrate`.
    for (const m of migrations) {
      console.log(`  ✗ Pending    ${m.version}_${m.name}.sql`);
    }
    console.log(`\n  0 applied, ${migrations.length} pending.`);
    console.log('  (schema_migrations table does not exist yet — run npm run migrate to initialise)\n');
    return;
  }

  // Table exists: query it normally.
  const applied = await getAppliedVersions(client);
  for (const m of migrations) {
    const mark = applied.has(m.version) ? '✓ Applied  ' : '✗ Pending  ';
    console.log(`  ${mark}  ${m.version}_${m.name}.sql`);
  }

  const pendingCount = migrations.filter((m) => !applied.has(m.version)).length;
  console.log(`\n  ${migrations.length - pendingCount} applied, ${pendingCount} pending.\n`);
}

// ---------------------------------------------------------------------------
// Main migration runner
// ---------------------------------------------------------------------------
async function runMigrations(client) {
  const migrations = loadMigrationFiles();

  if (migrations.length === 0) {
    console.log('[migrate] No migration files found. Nothing to apply.');
    return;
  }

  const applied = await getAppliedVersions(client);
  const pending = migrations.filter((m) => !applied.has(m.version));

  if (pending.length === 0) {
    console.log('[migrate] All migrations are already applied. Database is up to date.');
    return;
  }

  console.log(`[migrate] ${pending.length} pending migration(s) to apply.`);

  for (const migration of pending) {
    const label = `${migration.version}_${migration.name}`;
    console.log(`[migrate] Applying: ${label}.sql …`);

    let sql;
    try {
      sql = fs.readFileSync(migration.filepath, 'utf8');
    } catch (err) {
      console.error(`[migrate] Failed to read migration file: ${migration.filepath}`);
      console.error(`[migrate] ${err.message}`);
      process.exit(1);
    }

    // Wrap the migration SQL and the tracking INSERT in a single transaction.
    // If any statement fails, ROLLBACK fires and the version is never recorded.
    // The next invocation will retry this migration from scratch.
    try {
      await client.query('BEGIN;');
      await client.query(sql);
      await client.query(
        'INSERT INTO schema_migrations (version, name) VALUES ($1, $2);',
        [migration.version, migration.name]
      );
      await client.query('COMMIT;');
      console.log(`[migrate] ✓ Applied:  ${label}.sql`);
    } catch (err) {
      await client.query('ROLLBACK;');
      console.error(`[migrate] ✗ Failed:  ${label}.sql`);
      // Print the error message only — never print connection strings or credentials
      console.error(`[migrate] Error: ${err.message}`);
      console.error('[migrate] Transaction rolled back. Database unchanged.');
      process.exit(1);
    }
  }

  console.log('[migrate] All pending migrations applied successfully.');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
async function main() {
  const isStatusMode = process.argv.includes('--status');

  if (!process.env.DATABASE_URL) {
    console.error('[migrate] DATABASE_URL is not set. Check your .env file.');
    process.exit(1);
  }

  // Create a dedicated single client for the migration run.
  // Using a Pool for migrations is unnecessary and could cause connection
  // leaks if the process exits mid-migration.
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    // Honour sslmode=require for Neon connections
    ssl: process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : undefined,
  });

  try {
    await client.connect();
    console.log('[migrate] Connected to database.');

    if (isStatusMode) {
      // --status is read-only: skip the bootstrap entirely.
      // runStatus uses a catalog query to detect whether schema_migrations
      // exists and never creates or modifies any table.
      await runStatus(client);
    } else {
      // Normal run: bootstrap schema_migrations (idempotent), then apply
      // any pending migrations inside individual transactions.
      await client.query(BOOTSTRAP_SQL);
      await runMigrations(client);
    }
  } catch (err) {
    // Only print the error message, never the full connection string
    console.error('[migrate] Unexpected error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
