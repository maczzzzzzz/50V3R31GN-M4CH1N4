/**
 * scripts/recovery/backup-mind.ts
 * Phase 59: Mind backup utility — safe snapshot before nuke operations.
 */

import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = 'data/Akashik.db';
const BACKUP_DIR = 'data/archive';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

if (fs.existsSync(DB_PATH)) {
  const backupPath = path.join(BACKUP_DIR, `legacy-mind-${TIMESTAMP}.db`);
  fs.copyFileSync(DB_PATH, backupPath);
  console.log(`◈ BACKUP_COMPLETE: ${backupPath}`);
} else {
  console.warn(`◈ BACKUP_SKIPPED: ${DB_PATH} not found`);
}
