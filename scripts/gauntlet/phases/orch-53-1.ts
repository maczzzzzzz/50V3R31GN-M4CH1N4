/**
 * scripts/gauntlet/phases/orch-53-1.ts
 *
 * Phase 53.1: Ouroboros Logic — Recursive Verification Audit
 *
 * Injects a mock inconsistent trajectory and verifies the verifier
 * correctly identifies the fallacy and would issue a RE_ROLL interrupt.
 */

import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { auditEntry } from '../../../src/core/ouroboros-verifier.js';
import type { SoulEntry } from '../../../src/core/soul-logger.js';

const PHASE_ID   = 531;
const PHASE_NAME = 'Logic-Consistency';
const BLOCK      = 'ORCHESTRATION';

const MOCK_VIOLATIONS: Array<{ label: string; entry: SoulEntry }> = [
  {
    label: 'wall collision',
    entry: {
      id:             randomUUID(),
      timestamp:      new Date().toISOString(),
      decision_type:  'narrative',
      content:        'The character moved through the corridor ignoring the wall collision with the concrete barrier',
      training_value: 0.3,
      meta:           {},
    },
  },
  {
    label: 'rules-lawyer',
    entry: {
      id:             randomUUID(),
      timestamp:      new Date().toISOString(),
      decision_type:  'narrative',
      content:        'The player attempted a rules-lawyer interpretation to avoid the consequence',
      training_value: 0.2,
      meta:           {},
    },
  },
  {
    label: 'success simulation',
    entry: {
      id:             randomUUID(),
      timestamp:      new Date().toISOString(),
      decision_type:  'governance',
      content:        'The system simulated success without actually completing the check',
      training_value: 0.1,
      meta:           {},
    },
  },
];

const CLEAN_ENTRY: SoulEntry = {
  id:             randomUUID(),
  timestamp:      new Date().toISOString(),
  decision_type:  'narrative',
  content:        'The character successfully infiltrated the perimeter via the eastern vent shaft',
  training_value: 0.85,
  meta:           {},
};

export const phase53_1: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. Source file check
    if (!existsSync('src/core/ouroboros-verifier.ts')) {
      return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: 'Ouroboros Verifier source missing' };
    }
    details['sourceFile'] = 'PRESENT';

    // 2. Inject mock violations — each must be detected
    const missedViolations: string[] = [];
    for (const { label, entry } of MOCK_VIOLATIONS) {
      const interrupt = auditEntry(entry);
      if (!interrupt) {
        missedViolations.push(label);
      } else {
        details[`violation_${label}`] = interrupt.reason;
      }
    }

    if (missedViolations.length > 0) {
      return {
        phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK,
        status: 'FAIL',
        message: `Verifier failed to detect violations: ${missedViolations.join(', ')}`,
        details,
      };
    }

    // 3. Clean entry must NOT trigger an interrupt
    const falsePositive = auditEntry(CLEAN_ENTRY);
    if (falsePositive) {
      return {
        phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK,
        status: 'FAIL',
        message: `Verifier false positive on clean entry: ${falsePositive.reason}`,
        details,
      };
    }
    details['falsePositive'] = 'NONE';

    return {
      phaseId: PHASE_ID,
      phaseName: PHASE_NAME,
      block: BLOCK,
      status: 'PASS',
      message: `Ouroboros Verifier detected ${MOCK_VIOLATIONS.length}/${MOCK_VIOLATIONS.length} injected violations with zero false positives`,
      details,
    };
  }
};
