/**
 * src/core/hermes/LangGraphOrchestrator.ts
 *
 * Phase 63.5 — LangGraph Director Orchestrator
 *
 * Implements LangGraph-style state-machine turn-taking across the Trinity:
 *   Node A (Synapse) → long-context fetch / KV offload
 *   Node C (Oracle)  → rule calculation / RDT reasoning
 *   Node B (Director)→ narrative synthesis / scene generation
 *
 * Each graph node is a pure async function: State → Partial<State>.
 * Routing edges are conditional functions on the same State.
 *
 * Usage:
 *   const graph = new LangGraphOrchestrator(config);
 *   const result = await graph.invoke({ prompt, tokens: 0 });
 */

import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { HealerProtocol, RepairStrategy } from './HealerProtocol.js';
import { MemoryObserver } from './MemoryObserver.js';

// ---------------------------------------------------------------------------
// Phase 76 Task 3 — Hermes System Command Registry
// Slash commands are dispatched BEFORE LLM routing — no token cost.
// Crush is the canonical executor; Hermes is the routing layer.
// ---------------------------------------------------------------------------

const SYSTEM_COMMANDS = new Set(['/profile', '/status', '/vault']);

function dispatchSystemCommand(prompt: string): string | null {
  const trimmed = prompt.trim();
  const cmd = trimmed.split(/\s+/)[0]?.toLowerCase() ?? '';
  if (!SYSTEM_COMMANDS.has(cmd)) return null;

  const args = trimmed.slice(cmd.length).trim();
  try {
    switch (cmd) {
      case '/profile': {
        if (args) {
          // Switch active profile via crush — respects Hardgate invariants
          const result = execSync(`crush profile ${args} 2>&1 || true`, {
            encoding: 'utf8', shell: '/bin/bash',
          }).trim();
          return `◈ PROFILE SWITCH:\n${result}`;
        }
        // No args — read current active profile
        const identity = execSync('grep "ACTIVE_PROFILE" SOVEREIGN-IDENTITY.md', { encoding: 'utf8' }).trim();
        return `◈ PROFILE: ${identity}`;
      }
      case '/status': {
        // Delegate to crush belt list
        const belt = execSync('crush belt list 2>/dev/null || echo "crush: belt unavailable"', {
          encoding: 'utf8', shell: '/bin/bash',
        }).trim();
        return `◈ BELT STATUS:\n${belt}`;
      }
      case '/vault': {
        // Delegate to crush vault with any trailing args
        const vaultCmd = args ? `crush vault ${args}` : 'crush vault status';
        const vault = execSync(`${vaultCmd} 2>/dev/null || echo "crush: vault unavailable"`, {
          encoding: 'utf8', shell: '/bin/bash',
        }).trim();
        return `◈ VAULT:\n${vault}`;
      }
    }
  } catch (e) {
    return `◈ SYSTEM COMMAND ERROR [${cmd}]: ${e instanceof Error ? e.message : String(e)}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Checkpoints Database Setup
// ---------------------------------------------------------------------------
const checkpointDb = new Database('data/Akashik_Checkpoints.db');
checkpointDb.exec(`
  CREATE TABLE IF NOT EXISTS orchestrator_checkpoints (
    thread_id TEXT PRIMARY KEY,
    state TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ---------------------------------------------------------------------------
// State schema
// ---------------------------------------------------------------------------

export interface OrchestratorState {
  traceId: string;
  prompt: string;
  /** Token count of the current prompt (used for threshold routing) */
  tokens: number;
  /** Which Trinity node is currently responsible */
  activeNode: 'node-a' | 'node-b' | 'node-c' | 'done';
  /** Accumulated response from the active node */
  response: string;
  /** Structured rule result from Node C (if applicable) */
  ruleResult?: Record<string, unknown> | undefined;
  /** Narrative synthesis from Node B (if applicable) */
  narrative?: string | undefined;
  /** Error captured during a node execution */
  error?: string | undefined;
  /** Retry counter for self-correction (Healer Protocol) */
  retries: number;
  /** Agentic Audit Trail properties */
  file_path?: string | undefined;
  diff?: string | undefined;
  outcome?: 'SUCCESS' | 'FATAL' | undefined;
}

// ---------------------------------------------------------------------------
// Node target enum
// ---------------------------------------------------------------------------

export type NodeTarget = 'node-a' | 'node-b' | 'node-c';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export interface OrchestratorConfig {
  nodeAUrl: string;
  nodeBUrl: string;
  nodeCUrl: string;
  /** Token threshold above which long-context is offloaded to Node A */
  thresholdTokens: number;
  maxRetries: number;
  timeoutMs: number;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  nodeAUrl:        process.env.NODE_A_URL   ?? 'http://10.0.0.10:8080/v1',
  nodeBUrl:        process.env.NODE_B_URL   ?? 'http://10.0.0.20:7339/v1',
  nodeCUrl:        process.env.NODE_C_URL   ?? 'http://10.0.0.30:7339/v1',
  thresholdTokens: 4000,
  maxRetries:      2,
  timeoutMs:       45_000,
};

// ---------------------------------------------------------------------------
// Graph node implementations
// ---------------------------------------------------------------------------

async function callLlm(
  url: string,
  prompt: string,
  timeoutMs: number,
): Promise<string> {
  const res = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'local',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`LLM ${url} → ${res.status}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? '';
}

/** Node A: Long-context Synapse fetch */
async function nodeAFetch(
  state: OrchestratorState,
  cfg: OrchestratorConfig,
): Promise<Partial<OrchestratorState>> {
  const response = await callLlm(cfg.nodeAUrl, state.prompt, cfg.timeoutMs);
  return { response, activeNode: 'node-c' };
}

/** Node C: Rule arbitration / RDT reasoning */
async function nodeCReason(
  state: OrchestratorState,
  cfg: OrchestratorConfig,
): Promise<Partial<OrchestratorState>> {
  const contextPrompt = state.response
    ? `Context:\n${state.response}\n\nTask: ${state.prompt}`
    : state.prompt;
  const raw = await callLlm(cfg.nodeCUrl, contextPrompt, cfg.timeoutMs);
  let ruleResult: Record<string, unknown> | undefined;
  try { ruleResult = JSON.parse(raw) as Record<string, unknown>; } catch { /* non-JSON fine */ }
  return { response: raw, ruleResult, activeNode: 'node-b' };
}

/** Node B: Narrative synthesis */
async function nodeBSynthesize(
  state: OrchestratorState,
  cfg: OrchestratorConfig,
): Promise<Partial<OrchestratorState>> {
  const synthPrompt = [
    `You are the Sovereign Director. Synthesize a narrative response.`,
    `Rule result: ${state.response}`,
    `Original prompt: ${state.prompt}`,
  ].join('\n');
  const narrative = await callLlm(cfg.nodeBUrl, synthPrompt, cfg.timeoutMs);
  return { narrative, activeNode: 'done' };
}

// ---------------------------------------------------------------------------
// Routing edges (conditional)
// ---------------------------------------------------------------------------

function routeEntry(state: OrchestratorState, cfg: OrchestratorConfig): NodeTarget {
  // Threshold routing: long context → Node A first; tactical → Node C direct
  return state.tokens > cfg.thresholdTokens ? 'node-a' : 'node-c';
}

// ---------------------------------------------------------------------------
// LangGraphOrchestrator
// ---------------------------------------------------------------------------

export class LangGraphOrchestrator {
  private cfg: OrchestratorConfig;

  constructor(cfg: Partial<OrchestratorConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
  }

  private saveCheckpoint(threadId: string, state: OrchestratorState) {
    const stmt = checkpointDb.prepare(`
      INSERT INTO orchestrator_checkpoints (thread_id, state, updated_at) 
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(thread_id) DO UPDATE SET 
        state = excluded.state, 
        updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(threadId, JSON.stringify(state));
  }

  private loadCheckpoint(threadId: string): OrchestratorState | null {
    const stmt = checkpointDb.prepare('SELECT state FROM orchestrator_checkpoints WHERE thread_id = ?');
    const row = stmt.get(threadId) as { state: string } | undefined;
    if (row && row.state) {
      return JSON.parse(row.state) as OrchestratorState;
    }
    return null;
  }

  /**
   * Invoke the orchestration graph.
   * Returns the final state after all nodes have executed.
   */
  async invoke(input: { prompt: string; tokens?: number | undefined; file_path?: string | undefined; diff?: string | undefined; thread_id?: string | undefined }): Promise<OrchestratorState> {
    // Phase 76 Task 3: Pre-dispatch system commands — no LLM roundtrip.
    const sysResult = dispatchSystemCommand(input.prompt);
    if (sysResult !== null) {
      const tid = input.thread_id ?? randomUUID();
      const fastState: OrchestratorState = {
        traceId: tid, prompt: input.prompt, tokens: 0,
        activeNode: 'done', response: sysResult, retries: 0,
        outcome: 'SUCCESS',
      };
      await HealerProtocol.logAudit({ reasoning_trace: `SYS_CMD: ${input.prompt}`, outcome: 'SUCCESS' });
      return fastState;
    }

    const threadId = input.thread_id ?? randomUUID();
    let state: OrchestratorState | null = null;

    if (input.thread_id) {
      const existingState = this.loadCheckpoint(threadId);
      if (existingState && existingState.activeNode !== 'done') {
        state = existingState;
      }
    }

    if (!state) {
      const negativeConstraints = await HealerProtocol.getNegativeConstraints(input.prompt);
      const enrichedPrompt = negativeConstraints ? input.prompt + negativeConstraints : input.prompt;

      state = {
        traceId:    threadId,
        prompt:     enrichedPrompt,
        tokens:     input.tokens ?? 0,
        activeNode: routeEntry({ ...({} as OrchestratorState), tokens: input.tokens ?? 0 }, this.cfg),
        response:   '',
        retries:    0,
        error:      undefined,
        ruleResult: undefined,
        narrative:  undefined,
        file_path:  input.file_path,
        diff:       input.diff,
        outcome:    undefined,
      };
      this.saveCheckpoint(threadId, state);
    }

    while (state.activeNode !== 'done') {
      try {
        let delta: Partial<OrchestratorState>;

        switch (state.activeNode) {
          case 'node-a': delta = await nodeAFetch(state, this.cfg); break;
          case 'node-c': delta = await nodeCReason(state, this.cfg); break;
          case 'node-b': delta = await nodeBSynthesize(state, this.cfg); break;
          default: state = { ...state, activeNode: 'done' }; this.saveCheckpoint(threadId, state); continue;
        }

        state = { ...state, ...delta, error: undefined };
      } catch (err) {
        state = { ...state, error: err instanceof Error ? err.message : String(err) };
        
        const diagnosis = HealerProtocol.diagnose(state, this.cfg);
        console.warn(`::/HEALER_DIAGNOSIS : ${diagnosis.reason} [Strategy: ${diagnosis.strategy}]`);

        if (diagnosis.strategy === RepairStrategy.ABORT_MISSION) {
          state = { ...state, activeNode: 'done', outcome: 'FATAL' };
        } else if (diagnosis.suggestedState) {
          state = { ...state, ...diagnosis.suggestedState };
        }
      }

      this.saveCheckpoint(threadId, state);
    }

    if (!state.outcome && !state.error) {
      state.outcome = 'SUCCESS';
    } else if (!state.outcome && state.error) {
      state.outcome = 'FATAL';
    }
    
    this.saveCheckpoint(threadId, state); // Final checkpoint for the final outcome

    await HealerProtocol.logAudit({
      file_path: state.file_path,
      diff: state.diff,
      reasoning_trace: `Prompt: ${state.prompt}\nResponse: ${state.response}\nError: ${state.error || 'None'}`,
      outcome: state.outcome as 'SUCCESS' | 'FATAL'
    });

    // Phase 68.5: Trigger the asynchronous Memory Palace Observer to distill long-term facts
    MemoryObserver.observeAndDistill(state).catch((e: unknown) => console.error(e));

    return state;
  }
}
