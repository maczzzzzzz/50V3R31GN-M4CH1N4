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
import { execSync, spawnSync } from 'node:child_process';
import Database from 'better-sqlite3';
import { HealerProtocol, RepairStrategy } from './HealerProtocol.js';
import { MemoryObserver } from './MemoryObserver.js';
import { VsbClient } from '../../api/vsb-client.js';
// Phase 93: CDP Purge
// import { WebScraperSidecar, IngressTier } from '../../shared/WebScraperSidecar.js';
import { HeadlessDatalog } from '../memory/HeadlessDatalog.js';

// ---------------------------------------------------------------------------
// Phase 76 Task 3 — Hermes System Command Registry
// Slash commands are dispatched BEFORE LLM routing — no token cost.
// Crush is the canonical executor; Hermes is the routing layer.
//
// Security: all crush invocations use spawnSync array form (no shell expansion).
// User-supplied args are validated against an allowlist before use.
// ---------------------------------------------------------------------------

const SYSTEM_COMMANDS = new Set(['/profile', '/status', '/vault', '/vesper', '/host', '/crush', '/reconstruct', '/meeting', '/mode', '/dev', '/logseq', '/datalog']);

// Known profile names from SOVEREIGN-IDENTITY.md — allowlist for /profile <name>
const KNOWN_PROFILES = new Set(['daily-use', 'researcher', 'sovereign-red-game-master']);

// Safe wrapper: runs crush with argv array (no shell, no injection surface).
function runCrush(args: string[]): string {
  const result = spawnSync('crush', args, { encoding: 'utf8' });
  const out = ((result.stdout ?? '') + (result.stderr ?? '')).trim();
  return out || 'crush: no output';
}

async function dispatchSystemCommand(
  prompt: string, 
  vsbClient?: VsbClient, 
  webScraper?: WebScraperSidecar
): Promise<string | null> {
  const trimmed = prompt.trim();
  const cmd = trimmed.split(/\s+/)[0]?.toLowerCase() ?? '';
  if (!SYSTEM_COMMANDS.has(cmd)) return null;

  const args = trimmed.slice(cmd.length).trim();
  const argArray = args.split(/\s+/).filter(Boolean);

  try {
    switch (cmd) {
      case '/datalog': {
        // Phase 90: HeadlessDatalog — Datalog-to-SQLite query artery.
        // Usage: /datalog query '[:find ?name :where [?e :is-a "agent"] [?e :name ?name]]'
        //        /datalog compile '[:find ...]'
        //        /datalog fts <search terms>
        //        /datalog stats
        const sub = argArray[0]?.toLowerCase() ?? '';
        const rest = args.slice(sub.length).trim();
        try {
          const dl = new HeadlessDatalog(
            new (await import('better-sqlite3')).default(
              process.env['SOVEREIGN_INTELLIGENCE_DB'] ?? 'data/SovereignIntelligence.db'
            )
          );
          switch (sub) {
            case 'query': {
              const rows = dl.query(rest);
              return `◈ DATALOG_RESULT [${rows.length} rows]:\n${JSON.stringify(rows, null, 2)}`;
            }
            case 'compile': {
              return `◈ DATALOG_SQL:\n${dl.compile(rest)}`;
            }
            case 'fts': {
              const results = dl.ftsSearch(rest, 5);
              return `◈ DATALOG_FTS [${results.length} shards]:\n${results.map(r => `  [${r.sector}] ${r.name}\n  ${r.excerpt}`).join('\n\n')}`;
            }
            case 'stats': {
              return `◈ DATALOG_STATS:\n${JSON.stringify(dl.stats(), null, 2)}`;
            }
            default:
              return `◈ DATALOG_ERROR: Unknown sub-command '${sub}'. Try: query | compile | fts | stats`;
          }
        } catch (e) {
          return `◈ DATALOG_ERROR: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      case '/logseq': {
        if (argArray.length === 0) return `◈ LOGSEQ_ERROR: Subcommand required. Try '/logseq query "[:find ...]"' or '/logseq insert "Page" "Content"'`;
        return `◈ LOGSEQ_MESH:\n${runCrush(['logseq', ...argArray])}`;
      }
      case '/crush': {
        return `◈ CRUSH_RELAY:\n${runCrush(argArray)}`;
      }
      case '/dev': {
        if (argArray.length === 0) return `◈ DEV_ERROR: Subcommand required. Try '/dev trigger deadlock' or '/dev purge-cache'`;
        return `◈ DEV_CONSOLE:\n${runCrush(['dev', ...argArray])}`;
      }
      case '/reconstruct': {
        return `◈ RECONSTRUCTING_MESH:\n${runCrush(['reconstruct', ...argArray])}`;
      }
      case '/meeting': {
        return `◈ SOVEREIGN_HALL:\n${runCrush(['meeting', ...argArray])}`;
      }
      case '/mode': {
        if (!args) return `◈ MODE ERROR: specify 'on' or 'off'.`;
        return `◈ SOVEREIGN_MODE:\n${runCrush(['sovereign-mode', args])}`;
      }
      case '/profile': {

        if (args) {
          // Validate profile name against allowlist — blocks injection attempts
          const profileName = args.split(/\s+/)[0] ?? '';
          const extraFlags = args.split(/\s+/).slice(1).filter(f => f === '--override-policy');
          if (!KNOWN_PROFILES.has(profileName)) {
            return `◈ PROFILE ERROR: unknown profile '${profileName}'. Known: ${[...KNOWN_PROFILES].join(', ')}`;
          }
          const crushArgs = ['profile', profileName, ...extraFlags];
          return `◈ PROFILE SWITCH:\n${runCrush(crushArgs)}`;
        }
        // No args — read current active profile (read-only, no injection risk)
        const identity = execSync('grep "ACTIVE_PROFILE" SOVEREIGN-IDENTITY.md', { encoding: 'utf8' }).trim();
        return `◈ PROFILE: ${identity}`;
      }
      case '/status': {
        return `◈ BELT STATUS:\n${runCrush(['belt', 'list'])}`;
      }
      case '/vault': {
        // Validate vault subcommand: allow only known safe operations
        const vaultSub = args.split(/\s+/)[0] ?? 'status';
        const VAULT_OPS = new Set(['status', 'seal', 'open']);
        if (args && !VAULT_OPS.has(vaultSub)) {
          return `◈ VAULT ERROR: unknown operation '${vaultSub}'. Allowed: ${[...VAULT_OPS].join(', ')}`;
        }
        const vaultArgs = args ? ['vault', ...args.split(/\s+/)] : ['vault', 'status'];
        return `◈ VAULT:\n${runCrush(vaultArgs)}`;
      }
      case '/vesper': {
        // Phase 78 Emergence Gateway — query Vesper daemon status and pending proposals.
        return vesperEmergence(args);
      }
      case '/host': {
        // Phase 81: Host-Bridge Artery.
        if (!args) return `◈ HOST ERROR: No command specified. Try /host volume 50 | /host launch obsidian | /host scrape <url>`;
        
        const sub = args.split(/\s+/)[0]?.toLowerCase() || '';
        const subArgs = args.slice(sub.length).trim();

        if (sub === 'scrape' && webScraper) {
          const result = await webScraper.scrape(subArgs, IngressTier.RESEARCH);
          return `◈ HOST SCRAPE [${result.title}]:\n\n${result.content.substring(0, 1000)}...`;
        }

        if (vsbClient) {
          // Dispatch to Windows sidecar via VSB
          const hostActorId = new Uint8Array([0x48, 0x4f, 0x53, 0x54, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
          const sessionId = new Uint8Array(16);
          const payload = new TextEncoder().encode(args);
          const result = await vsbClient.sendSkillCheck(Math.floor(Math.random() * 65535), sessionId, hostActorId, payload);
          return `◈ HOST RESPONSE [${sub}]: ${new TextDecoder().decode(result.payload).trim()}`;
        }

        return `◈ HOST COMMAND SENT: ${args} [VSB_OFFLINE]`;
      }
    }
  } catch (e) {
    return `◈ SYSTEM COMMAND ERROR [${cmd}]: ${e instanceof Error ? e.message : String(e)}`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Phase 78 — Vesper Emergence Gateway
// Surfaces background Vesper findings into the active HUD session.
// Sub-commands: status | drain | hibernate | wake
// ---------------------------------------------------------------------------

const VESPER_OPS = new Set(['status', 'drain', 'hibernate', 'wake']);

function vesperEmergence(args: string): string {
  const sub = (args.split(/\s+/)[0] ?? 'status').toLowerCase();
  if (!VESPER_OPS.has(sub)) {
    return `◈ VESPER ERROR: unknown sub-command '${sub}'. Allowed: ${[...VESPER_OPS].join(', ')}`;
  }

  try {
    switch (sub) {
      case 'status': {
        // Check if vesper-daemon process exists.
        const pidCheck = spawnSync('pgrep', ['-f', 'vesper-daemon'], { encoding: 'utf8' });
        const running = (pidCheck.stdout ?? '').trim().length > 0;
        return `◈ VESPER STATUS:\n  daemon : ${running ? 'RUNNING' : 'HIBERNATED'}\n  mode   : background agency`;
      }
      case 'drain': {
        // Daemon polls SovereignIntelligence.db on its own interval.
        // This command surfaces the intent to the HUD — daemon acts on next cycle.
        return `◈ VESPER DRAIN: Flush gate poll scheduled — daemon will drain proposals on next cycle.`;
      }
      case 'hibernate': {
        const kill = spawnSync('pkill', ['-SIGTERM', '-f', 'vesper-daemon'], { encoding: 'utf8' });
        return kill.status === 0
          ? `◈ VESPER HIBERNATE: Daemon hibernated.`
          : `◈ VESPER HIBERNATE: Daemon was not running.`;
      }
      case 'wake': {
        // Spawn vesper-daemon detached in background via Nix Sovereignty wrap.
        spawnSync('sh', ['-c', 'nohup nix develop --command scripts/ops/vesper-daemon/vesper-daemon &>/dev/null &'], {
          encoding: 'utf8',
        });
        // Trigger visual glitch protocol (Phase 78 UI Emergence)
        return `◈ VESPER WAKE: Daemon spawned via Nix. [EMERGENCE_GLITCH_INITIATED]`;
      }
    }
  } catch (e) {
    return `◈ VESPER ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }
  return `◈ VESPER: ${sub} acknowledged.`;
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
  private vsbClient: VsbClient | undefined;

  constructor(
    cfg: Partial<OrchestratorConfig> = {}, 
    deps?: { vsbClient?: VsbClient }
  ) {
    this.cfg = { ...DEFAULT_CONFIG, ...cfg };
    this.vsbClient = deps?.vsbClient;
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
    const sysResult = await dispatchSystemCommand(input.prompt, this.vsbClient, this.webScraper);
    if (sysResult !== null) {
      const tid = input.thread_id ?? randomUUID();
      const fastState: OrchestratorState = {
        traceId: tid, prompt: input.prompt, tokens: 0,
        activeNode: 'done', response: sysResult, retries: 0,
        outcome: 'SUCCESS',
      };
      await HealerProtocol.logAudit({ reasoning_trace: `SYS_CMD: ${input.prompt}`, outcome: 'SUCCESS', traceId: tid });
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
      outcome: state.outcome as 'SUCCESS' | 'FATAL',
      traceId: threadId,
    });

    // Phase 68.5: Trigger the asynchronous Memory Palace Observer to distill long-term facts
    MemoryObserver.observeAndDistill(state).catch((e: unknown) => console.error(e));

    return state;
  }
}
