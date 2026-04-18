/**
 * scripts/recovery/migrate-v4.ts
 * Phase 59: Brownfield migration — adds v4 columns to existing Akashik.db.
 * Safe to run multiple times (checks PRAGMA table_info before each ALTER).
 */

import Database from 'better-sqlite3';

const DB_PATH = process.env['AKASHIK_DB_PATH'] ?? 'data/Akashik.db';
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

function hasColumn(table: string, col: string): boolean {
  const info = db.pragma(`table_info(${table})`) as { name: string }[];
  return info.some(r => r.name === col);
}

function addColumn(table: string, col: string, def: string): void {
  if (hasColumn(table, col)) {
    console.log(`  skip: ${table}.${col} exists`);
    return;
  }
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
  console.log(`  added: ${table}.${col}`);
}

console.log('::/5Y573M-N071C3 : migrate-v4 — BROWNFIELD MIGRATION...');

addColumn('npcs', 'interface_level', 'INTEGER DEFAULT 0');
addColumn('npcs', 'rez', 'INTEGER DEFAULT 0');
addColumn('npcs', 'deck_slots', 'INTEGER DEFAULT 0');
addColumn('npcs', 'head_sp', 'INTEGER DEFAULT 0');
addColumn('npcs', 'body_sp', 'INTEGER DEFAULT 0');

addColumn('items', 'concealable', 'BOOLEAN DEFAULT 0');
addColumn('items', 'slots_used', 'INTEGER DEFAULT 0');
addColumn('items', 'reliability', 'TEXT');
addColumn('items', 'is_installed', 'BOOLEAN DEFAULT 0');

db.close();
console.log('::/5Y573M-N071C3 : MIGRATION COMPLETE');
