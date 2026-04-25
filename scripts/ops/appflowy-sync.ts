#!/usr/bin/env tsx
/**
 * scripts/ops/appflowy-sync.ts — Phase 76, Task 4: Roadmap Artery
 *
 * Parses IMPLEMENTATION_PLAN.md and pushes tasks to the AppFlowy Cloud
 * REST API, keeping the Sovereign project board in sync with the ledger.
 *
 * Usage:
 *   tsx scripts/ops/appflowy-sync.ts [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APPFLOWY_BASE  = process.env.APPFLOWY_URL  ?? 'http://10.0.0.12:3000';
const APPFLOWY_TOKEN = process.env.APPFLOWY_TOKEN ?? '';
const PLAN_PATH      = resolve(import.meta.dirname ?? process.cwd(), '../../IMPLEMENTATION_PLAN.md');
const DRY_RUN        = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Phase / Task parser
// ---------------------------------------------------------------------------

interface Task {
  phase:      string;
  phaseState: 'COMPLETED' | 'IN-PROGRESS' | 'STAGED';
  taskNum:    string;
  title:      string;
  done:       boolean;
  detail:     string;
}

function parsePlan(markdown: string): Task[] {
  const tasks: Task[] = [];
  let currentPhase = '';
  let currentPhaseState: 'COMPLETED' | 'IN-PROGRESS' | 'STAGED' = 'STAGED';

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Phase header
    const phaseMatch = trimmed.match(/^##\s+([^\s]+)\s+(PHASE\s+[\d.]+[^(]*)(?:\((.*?)\))?/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[2].trim().replace(/:$/, '');
      const statusText = (phaseMatch[3] ?? '').toUpperCase();
      const emoji = phaseMatch[1];

      if (statusText.includes('COMPLETED') || emoji === '✅') {
        currentPhaseState = 'COMPLETED';
      } else if (statusText.includes('IN-PROGRESS') || ['🛠️', '🛡️', '🧠', '📱'].includes(emoji)) {
        currentPhaseState = 'IN-PROGRESS';
      } else {
        currentPhaseState = 'STAGED';
      }
      // console.log(`[DEBUG] Phase: ${currentPhase} | State: ${currentPhaseState}`);
      continue;
    }

    // Task line
    const taskMatch = trimmed.match(/^- \[(x| )\]\s+\*\*(Task\s+\d+):\s+(.*?)\*\*(.*)$/i);
    if (taskMatch && currentPhase) {
      tasks.push({
        phase:      currentPhase,
        phaseState: currentPhaseState,
        taskNum:    taskMatch[2],
        title:      taskMatch[3].trim().replace(/:$/, ''),
        done:       taskMatch[1].toLowerCase() === 'x',
        detail:     taskMatch[4].trim().replace(/^[:\s]+/, ''),
      });
    }
  }
  return tasks;
}

// ---------------------------------------------------------------------------
// AppFlowy REST push
// ---------------------------------------------------------------------------

async function upsertTask(task: Task): Promise<void> {
  let status = 'To Do';
  if (task.done) {
    status = 'Done';
  } else if (task.phaseState === 'IN-PROGRESS') {
    status = 'In Progress';
  }

  const body = {
    name:   `[${task.phase}] ${task.taskNum}: ${task.title}`,
    status,
    notes:  task.detail || undefined,
  };

  if (DRY_RUN) {
    console.log(`  [DRY] ${body.status.padEnd(12)} | ${body.name}`);
    return;
  }

  const res = await fetch(`${APPFLOWY_BASE}/api/workspace/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${APPFLOWY_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.warn(`  ⚠️  [SYNC] ${res.status} upsert failed for "${body.name}": ${text}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('◈ [ARTERY] AppFlowy Roadmap Sync initiated...');
  if (DRY_RUN) console.log('  (DRY RUN — no writes)');

  const markdown = readFileSync(PLAN_PATH, 'utf8');
  const tasks    = parsePlan(markdown);

  console.log(`  Parsed ${tasks.length} tasks from IMPLEMENTATION_PLAN.md`);

  for (const task of tasks) {
    await upsertTask(task);
  }

  console.log(`✅ [ARTERY] Sync complete — ${tasks.length} tasks pushed to AppFlowy.`);
}

main().catch((err) => {
  console.error('FATAL [appflowy-sync]:', err);
  process.exit(1);
});
