/**
 * dream-daemon.ts — Phase 34 / Phase 80 Ouroboros Extension
 *
 * A background consolidation process that runs on Node A during idle GPU cycles.
 * It cycles through four phases to promote short-term lore signals into durable
 * world-state facts stored in Akashik.db and summarized in docs/DREAMS.md.
 *
 * Phases:
 *   1. LIGHT     — Tally recency/frequency of memory signals from triplets.
 *   2. REM       — Dispatch top signals to Node A 1.5B Reasoner for association/contradiction audit.
 *   3. DEEP      — Commit "True Facts" to Akashik.db and append to docs/DREAMS.md.
 *   4. OUROBOROS — Ingest unprocessed Sovereign Hall meeting transcripts and generate
 *                  "Logic Vaccinations" — constraint directives prepended to future prompts.
 *
 * Usage:
 *   tsx src/scripts/dream-daemon.ts [--once] [--schedule=<cron>]
 *
 *   --once              Run a single dream cycle and exit (default: loop indefinitely).
 *   --schedule=<cron>   Cron expression for auto scheduling (default: '0 3 * * *').
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import 'dotenv/config';
import Database from 'better-sqlite3';
import { z } from 'zod';
import cron from 'node-cron';
import { ArteryClient } from '../shared/ArteryClient.js';

// ── Config ────────────────────────────────────────────────────────────────────

const NODE_A_MODEL    = process.env['NODE_A_MODEL'] ?? 'open-reasoner-zero-1.5b';
const AKASHIK_DB_PATH = process.env['AKASHIK_DB_PATH'] ?? 'data/Akashik.db';
const SIGNAL_LIMIT    = parseInt(process.env['DREAM_SIGNAL_LIMIT'] ?? '20', 10);
const MEETINGS_DIR    = process.env['MEETINGS_DIR'] ?? 'data/meetings';
const VACCINES_PATH   = process.env['VACCINES_PATH'] ?? 'data/logic_vaccinations.jsonl';
const RED_MODE_ACTIVE = process.env['RED_MODE_ACTIVE'] === 'true' || process.env['RED_MODE_ACTIVE'] === '1';

const args = process.argv.slice(2);
const runOnce = args.includes('--once');
const scheduleArg = args.find(a => a.startsWith('--schedule='));
const schedule = scheduleArg ? scheduleArg.split('=')[1]! : '0 3 * * *';

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

// ── Phase 2: REM — Contradiction Audit via Artery ────────────────────────────

async function remPhase(signals: LoreSignal[], cycleId: string): Promise<RemAudit> {
  process.stdout.write('[Dream:REM] Dispatching signals to Artery (Node A Reasoner)...\n');

  const signalText = signals
    .map(s => `- ${s.subject} ${s.predicate}: "${s.object}" (freq=${s.frequency})`)
    .join('\n');

  const systemPrompt = `You are a lore consolidation engine for a NODESTADT Authority campaign.
You receive a list of recent world-state signals and must:
1. Identify TRUE FACTS: statements that are consistent and can be committed as durable world-state.
2. Identify CONTRADICTIONS: pairs of signals that conflict with each other.
3. Extract THEMES and REFLECTIONS from the data.
4. Write a brief SUMMARY of the most important world developments.

Output ONLY valid JSON with exactly these fields:
{"true_facts":["..."],"contradictions":["..."],"themes":["..."],"reflections":["..."],"summary":"...","reasoning":"..."}`;

  const userMessage = `Analyze these recent lore signals from NODESTADT (cycle ${cycleId}):\n\n${signalText}`;

  const content = await ArteryClient.chat({
    model: NODE_A_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.1,
    top_k: 1,
    top_p: 1.0,
    response_format: { type: 'json_object' },
  }, `dream-cycle-${cycleId}`);

  const parsed = RemAuditSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(`[Dream:REM] Artery response failed Zod validation: ${parsed.error.issues[0]?.message}`);
  }

  process.stdout.write(`[Dream:REM] Audit complete. True facts: ${parsed.data.true_facts.length}, Contradictions: ${parsed.data.contradictions.length}\n`);
  return parsed.data;
}

// ── Phase 3: DEEP — RKG Commitment ────────────────────

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

  process.stdout.write(`[Dream:DEEP] ${audit.true_facts.length} facts committed to DB.\n`);
}

// ── Phase 4: OUROBOROS — Meeting Transcript Ingestion & Logic Vaccinations ────

async function ouroborosPhase(cycleId: string): Promise<void> {
  process.stdout.write('[Dream:OUROBOROS] Scanning meeting vaults...\n');

  let vaultCount = 0;
  let vaccinationCount = 0;

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(MEETINGS_DIR);
  } catch {
    process.stdout.write('[Dream:OUROBOROS] No meetings dir found — skipping.\n');
    return;
  }

  for (const traceId of entries) {
    const meetDir = path.join(MEETINGS_DIR, traceId);
    const stat = fs.statSync(meetDir);
    if (!stat.isDirectory()) continue;

    const stampPath = path.join(meetDir, 'processed.stamp');
    if (fs.existsSync(stampPath)) continue;

    const thoughtFiles = fs.readdirSync(meetDir).filter(f => f.endsWith('.thought'));
    if (thoughtFiles.length === 0) continue;

    const fragments = thoughtFiles
      .map(f => {
        try { return { agent: f.replace('.thought', ''), content: fs.readFileSync(path.join(meetDir, f), 'utf-8') }; }
        catch { return null; }
      })
      .filter((x): x is { agent: string; content: string } => x !== null);

    if (fragments.length === 0) continue;

    vaultCount++;

    try {
      const fragmentText = fragments
        .map(f => `### Agent: ${f.agent}\n${f.content}`)
        .join('\n\n---\n\n');

      const systemPrompt = `You are the Ouroboros Reflection Engine. You receive thought fragments from a Sovereign Hall meeting and must extract a single concise "Logic Vaccination" — a directive constraint that prevents the same class of deadlock from recurring.

Output ONLY valid JSON: {"directive":"<one-sentence constraint>","confidence":0.0-1.0,"reasoning":"<brief>"}`;

      const userMessage = `Meeting trace_id: ${traceId}\n\nThought Fragments:\n\n${fragmentText}`;

      const content = await ArteryClient.chat({
        model: NODE_A_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }, `ouroboros-${traceId}`);

      const parsed = JSON.parse(content) as { directive: string; confidence: number; reasoning: string };

      const vaccination = {
        id: randomUUID(),
        trace_id: traceId,
        cycle_id: cycleId,
        directive: parsed.directive,
        source_agents: fragments.map(f => f.agent),
        created_at: new Date().toISOString(),
      };

      const vaccinesDir = path.dirname(VACCINES_PATH);
      if (!fs.existsSync(vaccinesDir)) fs.mkdirSync(vaccinesDir, { recursive: true });
      fs.appendFileSync(VACCINES_PATH, JSON.stringify(vaccination) + '\n', 'utf-8');

      vaccinationCount++;
      process.stdout.write(`[Dream:OUROBOROS] Vaccination generated for trace=${traceId}: "${parsed.directive.slice(0, 80)}..."\n`);
    } catch (err) {
      process.stderr.write(`[Dream:OUROBOROS] Synthesis failed for ${traceId}: ${err}\n`);
    }

    fs.writeFileSync(stampPath, new Date().toISOString() + '\n', 'utf-8');
  }

  process.stdout.write(`[Dream:OUROBOROS] ${vaultCount} vaults scanned, ${vaccinationCount} vaccinations generated.\n`);
}

async function dreamCycle(): Promise<void> {
  const cycleId = randomUUID().slice(0, 8);
  process.stdout.write(`\n[DreamDaemon] ===== CYCLE ${cycleId} START =====\n`);

  const db = openDb();
  try {
    const signals = lightPhase(db);
    if (signals.length === 0) {
      process.stdout.write('[DreamDaemon] No signals to process. Cycle skipped.\n');
      return;
    }

    const audit = await remPhase(signals, cycleId);
    deepPhase(db, audit, cycleId);
    await ouroborosPhase(cycleId);

    process.stdout.write(`[DreamDaemon] ===== CYCLE ${cycleId} COMPLETE =====\n`);
  } finally {
    db.close();
  }
}

async function main(): Promise<void> {
  if (!RED_MODE_ACTIVE) {
    process.stdout.write('[DreamDaemon] RED_MODE_OFFLINE. Simulation layer dormant.\n');
    return;
  }

  process.stdout.write('[DreamDaemon] OpenClaw Dreaming Loop online.\n');

  if (runOnce) {
    await dreamCycle();
    return;
  }

  process.stdout.write(`[DreamDaemon] Auto dreaming scheduled with cron: ${schedule}\n`);
  cron.schedule(schedule, async () => {
    try {
      await dreamCycle();
    } catch (err) {
      process.stderr.write(`[DreamDaemon] Cycle error: ${err}\n`);
    }
  });
}

main().catch(err => {
  process.stderr.write(`[DreamDaemon] Fatal: ${err}\n`);
  process.exit(1);
});
