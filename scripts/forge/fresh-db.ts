/**
 * scripts/forge/fresh-db.ts
 *
 * Phase 57: Sovereign Mind Rebuild — Database Reset Script
 *
 * Drops all tables and re-applies world-schema.sql.
 * Run ONLY as part of the Phase 57 "Nuke & Fire" sequence.
 *
 * Usage:
 *   nix develop --impure --command tsx scripts/forge/fresh-db.ts
 *   nix develop --impure --command tsx scripts/forge/fresh-db.ts --dry-run
 */

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DRY_RUN = process.argv.includes('--dry-run');
const DB_PATH = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';
const SCHEMA_PATH = path.resolve('./packages/hermes-core/src/db/world-schema.sql');
const PALACE_SCHEMA_PATH = path.resolve('./packages/hermes-core/src/db/palace-schema.sql');

function log(msg: string): void {
  console.log(`::/5Y573M-N071C3 : ${msg}`);
}

function dropAllTables(db: Database.Database): void {
  // Drop FTS5 virtual tables first (they have dependencies)
  const virtualTables = db.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND sql LIKE '%USING fts5%'`
  ).all() as Array<{ name: string }>;

  // Drop triggers, then virtual tables, then regular tables
  const triggers = db.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'trigger'`
  ).all() as Array<{ name: string }>;

  const tables = db.prepare(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
  ).all() as Array<{ name: string }>;

  if (DRY_RUN) {
    log(`DRY-RUN: Would drop ${triggers.length} triggers, ${virtualTables.length} virtual tables, ${tables.length} tables`);
    return;
  }

  db.exec('PRAGMA foreign_keys = OFF;');

  for (const { name } of triggers) {
    db.exec(`DROP TRIGGER IF EXISTS "${name}"`);
    log(`  >> Dropped trigger: ${name}`);
  }

  for (const { name } of virtualTables) {
    db.exec(`DROP TABLE IF EXISTS "${name}"`);
    log(`  >> Dropped virtual table: ${name}`);
  }

  for (const { name } of tables) {
    db.exec(`DROP TABLE IF EXISTS "${name}"`);
    log(`  >> Dropped table: ${name}`);
  }

  db.exec('PRAGMA foreign_keys = ON;');
}

async function main(): Promise<void> {
  log('INITIATING PHASE 57 DATABASE RESET...');

  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`❌ Schema not found at: ${SCHEMA_PATH}`);
    process.exit(1);
  }
  const hasPalaceSchema = fs.existsSync(PALACE_SCHEMA_PATH);

  if (DRY_RUN) {
    log('MODE: DRY-RUN — no changes will be made');
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  log(`Connected to: ${DB_PATH}`);
  log('Step 1: Dropping all existing objects...');
  dropAllTables(db);

  if (!DRY_RUN) {
    log('Step 2: Applying world-schema.sql...');
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    if (hasPalaceSchema) {
      log('Step 2b: Applying palace-schema.sql...');
      const palaceSchema = fs.readFileSync(PALACE_SCHEMA_PATH, 'utf-8');
      db.exec(palaceSchema);
    }
    log('Step 3: Running integrity check...');
    const result = db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    if (result.integrity_check !== 'ok') {
      console.error(`❌ Integrity check failed: ${result.integrity_check}`);
      db.close();
      process.exit(1);
    }
    log('Integrity check: OK');
  }

  db.close();
  log(DRY_RUN ? 'DRY-RUN COMPLETE. No changes made.' : '✅ DATABASE RESET COMPLETE. Schema is fresh.');
}

main().catch(err => {
  console.error('❌ FATAL:', err);
  process.exit(1);
});
