/**
 * dream-daemon.ts — Phase 34: OpenClaw Dreaming Loop
 *
 * A background consolidation process that runs on Node A during idle GPU cycles.
 * It cycles through three phases to promote short-term lore signals into durable
 * world-state facts stored in Akashik.db and summarized in docs/DREAMS.md.
 *
 * Phases:
 *   1. LIGHT  — Tally recency/frequency of lore signals from npc_logs and triplets.
 *   2. REM    — Dispatch top signals to Node A 1.5B Reasoner for association/contradiction audit.
 *   3. DEEP   — Commit "True Facts" to Akashik.db and append to docs/DREAMS.md.
 *
 * Usage:
 *   tsx src/scripts/dream-daemon.ts [--once] [--interval-ms=<ms>]
 *
 *   --once         Run a single dream cycle and exit (default: loop indefinitely).
 *   --interval-ms  Sleep between cycles in ms (default: 300000 = 5 minutes).
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import Database from 'better-sqlite3';
import { z } from 'zod';

// ── Config ────────────────────────────────────────────────────────────────────

const NODE_A_BASE_URL = process.env['NODE_A_URL'] ?? 'http://192.168.1.100:8080/v1';
const NODE_A_MODEL    = process.env['NODE_A_MODEL'] ?? 'open-reasoner-zero-1.5b';
const AKASHIK_DB_PATH = process.env['AKASHIK_DB_PATH'] ?? 'data/Akashik.db';
const DREAMS_MD_PATH  = process.env['DREAMS_MD_PATH'] ?? 'docs/DREAMS.md';
const SIGNAL_LIMIT    = parseInt(process.env['DREAM_SIGNAL_LIMIT'] ?? '20', 10);

const args = process.argv.slice(2);
const runOnce = args.includes('--once');
const intervalArg = args.find(a => a.startsWith('--interval-ms='));
const intervalMs = intervalArg ? parseInt(intervalArg.split('=')[1]!, 10) : 300_000;

// ── Types ─────────────────────────────────────────────────────────────────────

interface LoreSignal {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  frequency: number;
  last_seen: string;
}

// Zod schema for Node A REM audit response (Zero-Trust)
const RemAuditSchema = z.object({
  true_facts: z.array(z.string()).min(0),
  contradictions: z.array(z.string()).min(0),
  summary: z.string().min(1),
  reasoning: z.string().min(1),
});

type RemAudit = z.infer<typeof RemAuditSchema>;

// ── Database helpers ──────────────────────────────────────────────────────────

function openDb(): Database.Database {
  if (!fs.existsSync(AKASHIK_DB_PATH)) {
    throw new Error(`[DreamDaemon] Akashik.db not found at ${AKASHIK_DB_PATH}`);
  }
  const db = new Database(AKASHIK_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Ensure dream_facts table exists for DEEP phase commits
  db.exec(`
    CREATE TABLE IF NOT EXISTS dream_facts (
      id          TEXT PRIMARY KEY,
      fact        TEXT NOT NULL,
      source      TEXT NOT NULL DEFAULT 'dream-daemon',
      cycle_id    TEXT NOT NULL,
      committed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_dream_facts_cycle ON dream_facts(cycle_id);
  `);

  return db;
}

// ── Phase 1: LIGHT — Signal Tallying ─────────────────────────────────────────

function lightPhase(db: Database.Database): LoreSignal[] {
  process.stdout.write('[Dream:LIGHT] Tallying lore signals...\n');

  // Score triplets by frequency (count of same subject+predicate pairs)
  // and recency (most recently inserted rows rank higher).
  const signals = db.prepare(`
    SELECT
      MIN(id)          AS id,
      subject_id       AS subject,
      predicate,
      MAX(object_literal) AS object,
      COUNT(*)         AS frequency,
      MAX(created_at)  AS last_seen
    FROM triplets
    WHERE created_at >= datetime('now', '-7 days')
    GROUP BY subject_id, predicate
    ORDER BY frequency DESC, last_seen DESC
    LIMIT ?
  `).all(SIGNAL_LIMIT) as LoreSignal[];

  process.stdout.write(`[Dream:LIGHT] ${signals.length} signals tallied.\n`);
  return signals;
}

// ── Phase 2: REM — Contradiction Audit via Node A ────────────────────────────

async function remPhase(signals: LoreSignal[], cycleId: string): Promise<RemAudit> {
  process.stdout.write('[Dream:REM] Dispatching signals to Node A Reasoner...\n');

  const signalText = signals
    .map(s => `- ${s.subject} ${s.predicate}: "${s.object}" (freq=${s.frequency})`)
    .join('\n');

  const systemPrompt = `You are a lore consolidation engine for a Cyberpunk RED campaign.
You receive a list of recent world-state signals and must:
1. Identify TRUE FACTS: statements that are consistent and can be committed as durable world-state.
2. Identify CONTRADICTIONS: pairs of signals that conflict with each other.
3. Write a brief SUMMARY of the most important world developments.

Output ONLY valid JSON with exactly these fields:
{"true_facts":["fact1","fact2"],"contradictions":["contradiction1"],"summary":"string","reasoning":"string"}`;

  const userMessage = `Analyze these recent lore signals from Night City (cycle ${cycleId}):\n\n${signalText}`;

  const response = await fetch(`${NODE_A_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: NODE_A_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,
      top_k: 1,
      top_p: 1.0,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`[Dream:REM] Node A returned HTTP ${response.status}: ${body}`);
  }

  const json = await response.json() as { choices: Array<{ message: { content: string } }> };
  const content = json.choices[0]?.message?.content;
  if (!content) throw new Error('[Dream:REM] Node A returned empty response');

  const parsed = RemAuditSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(`[Dream:REM] Node A response failed Zod validation: ${parsed.error.issues[0]?.message}`);
  }

  process.stdout.write(`[Dream:REM] Audit complete. True facts: ${parsed.data.true_facts.length}, Contradictions: ${parsed.data.contradictions.length}\n`);
  return parsed.data;
}

// ── Phase 3: DEEP — RKG Commitment & DREAMS.md Generation ────────────────────

function deepPhase(db: Database.Database, audit: RemAudit, cycleId: string): void {
  process.stdout.write('[Dream:DEEP] Committing true facts to Akashik.db...\n');

  const insert = db.prepare(
    'INSERT OR IGNORE INTO dream_facts (id, fact, cycle_id) VALUES (?, ?, ?)'
  );
  const transaction = db.transaction((facts: string[]) => {
    for (const fact of facts) {
      insert.run(randomUUID(), fact, cycleId);
    }
  });
  transaction(audit.true_facts);

  // Append cycle entry to DREAMS.md
  const timestamp = new Date().toISOString();
  const entry = [
    `\n## Dream Cycle \`${cycleId}\` — ${timestamp}`,
    '',
    `**Summary:** ${audit.summary}`,
    '',
    '**True Facts Committed:**',
    ...audit.true_facts.map(f => `- ${f}`),
    '',
    audit.contradictions.length > 0
      ? ['**Contradictions Detected:**', ...audit.contradictions.map(c => `- ⚠️ ${c}`)].join('\n')
      : '**Contradictions:** None detected.',
    '',
    `**Reasoner Notes:** ${audit.reasoning}`,
    '',
    '---',
  ].join('\n');

  const dreamsDir = path.dirname(DREAMS_MD_PATH);
  if (!fs.existsSync(dreamsDir)) fs.mkdirSync(dreamsDir, { recursive: true });

  if (!fs.existsSync(DREAMS_MD_PATH)) {
    fs.writeFileSync(DREAMS_MD_PATH, '# DREAMS.md — OpenClaw Consolidation Log\n\n*Automatically generated by dream-daemon. Do not edit by hand.*\n', 'utf8');
  }
  fs.appendFileSync(DREAMS_MD_PATH, entry, 'utf8');

  process.stdout.write(`[Dream:DEEP] ${audit.true_facts.length} facts committed. DREAMS.md updated.\n`);
}

// ── Main Loop ─────────────────────────────────────────────────────────────────

async function dreamCycle(): Promise<void> {
  const cycleId = randomUUID().slice(0, 8);
  process.stdout.write(`\n[DreamDaemon] ===== CYCLE ${cycleId} START =====\n`);

  const db = openDb();
  try {
    // Phase 1: LIGHT
    const signals = lightPhase(db);
    if (signals.length === 0) {
      process.stdout.write('[DreamDaemon] No signals to process. Cycle skipped.\n');
      return;
    }

    // Phase 2: REM
    const audit = await remPhase(signals, cycleId);

    // Phase 3: DEEP
    deepPhase(db, audit, cycleId);

    process.stdout.write(`[DreamDaemon] ===== CYCLE ${cycleId} COMPLETE =====\n`);
  } finally {
    db.close();
  }
}

async function main(): Promise<void> {
  process.stdout.write('[DreamDaemon] OpenClaw Dreaming Loop online.\n');
  process.stdout.write(`[DreamDaemon] Node A: ${NODE_A_BASE_URL} | DB: ${AKASHIK_DB_PATH}\n`);

  if (runOnce) {
    await dreamCycle();
    return;
  }

  // Continuous loop
  while (true) {
    try {
      await dreamCycle();
    } catch (err) {
      process.stderr.write(`[DreamDaemon] Cycle error: ${err}\n`);
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
}

main().catch(err => {
  process.stderr.write(`[DreamDaemon] Fatal: ${err}\n`);
  process.exit(1);
});
