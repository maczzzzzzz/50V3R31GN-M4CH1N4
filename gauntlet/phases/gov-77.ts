/**
 * gauntlet/phases/gov-77.ts — Phase 80, Task 4.1
 *
 * Resilience Forge: Resonant Gate (Phase 77) policy precedence tests.
 *
 * Tests the TypeScript-level policy representation that mirrors the Rust
 * crates/resonant-gate rule engine. These tests exercise the decision-audit
 * logic and ensure the orchestrator's gate evaluations are deterministic.
 *
 * Policies under test:
 *   "default"    — allows llm_query/profile_switch; escalates shell_exec/vault_op; denies destructive
 *   "hardened"   — allows llm_query only; deny_unknown=true
 *   "researcher" — allows llm_query/vault_op_read; denies shell_exec
 *
 * Run: tsx gauntlet/phases/gov-77.ts
 */

// ── Policy types (mirrors Rust crates/resonant-gate) ─────────────────────────

type Verdict =
  | { type: 'Approved' }
  | { type: 'Denied';   reason: string }
  | { type: 'Escalate'; reason: string };

interface PolicyRule {
  policy:       string;
  allowed:      Set<string>;
  denied:       Set<string>;
  escalate:     Set<string>;
  deny_unknown: boolean;
}

// ── Rule Engine (deterministic — no I/O, no randomness) ──────────────────────

class RuleEngine {
  private policies: Map<string, PolicyRule>;

  constructor() {
    this.policies = new Map();
    this.loadDefaultPolicies();
  }

  private loadDefaultPolicies() {
    this.addPolicy({
      policy:       'default',
      allowed:      new Set(['llm_query', 'profile_switch', 'status_query']),
      denied:       new Set(['destructive_write', 'rm_rf', 'drop_table']),
      escalate:     new Set(['shell_exec', 'vault_op']),
      deny_unknown: false,
    });
    this.addPolicy({
      policy:       'hardened',
      allowed:      new Set(['llm_query']),
      denied:       new Set(),
      escalate:     new Set(),
      deny_unknown: true,
    });
    this.addPolicy({
      policy:       'researcher',
      allowed:      new Set(['llm_query', 'vault_op_read']),
      denied:       new Set(['shell_exec']),
      escalate:     new Set(),
      deny_unknown: false,
    });
  }

  private addPolicy(rule: PolicyRule): void {
    this.policies.set(rule.policy, rule);
  }

  evaluate(policy: string, actionType: string): Verdict {
    const rule = this.policies.get(policy);
    if (!rule) {
      return { type: 'Escalate', reason: `Unknown policy: ${policy}` };
    }

    // Evaluation order: DENY > ESCALATE > ALLOW > default
    if (rule.denied.has(actionType)) {
      return { type: 'Denied', reason: `Action '${actionType}' explicitly denied by policy '${policy}'` };
    }
    if (rule.escalate.has(actionType)) {
      return { type: 'Escalate', reason: `Action '${actionType}' requires Strategist approval` };
    }
    if (rule.allowed.has(actionType)) {
      return { type: 'Approved' };
    }
    // Unknown action
    if (rule.deny_unknown) {
      return { type: 'Denied', reason: `Action '${actionType}' not in allowlist (deny_unknown=true)` };
    }
    return { type: 'Escalate', reason: `Action '${actionType}' unknown — escalating` };
  }
}

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    process.stdout.write(`  ✓ ${label}\n`);
    passed++;
  } else {
    process.stderr.write(`  ✗ ${label}${detail ? ` — ${detail}` : ''}\n`);
    failed++;
  }
}

function assertVerdict(label: string, v: Verdict, expected: Verdict['type']): void {
  assert(label, v.type === expected, `expected=${expected} got=${v.type}`);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

function runGov77(): void {
  process.stdout.write('\n◈ GOV-77: Resonant Gate Policy Precedence\n');
  process.stdout.write('─'.repeat(50) + '\n');

  const engine = new RuleEngine();

  // --- Default policy ---
  process.stdout.write('\n[default policy]\n');

  assertVerdict(
    'llm_query → Approved',
    engine.evaluate('default', 'llm_query'),
    'Approved',
  );
  assertVerdict(
    'profile_switch → Approved',
    engine.evaluate('default', 'profile_switch'),
    'Approved',
  );
  assertVerdict(
    'shell_exec → Escalate (requires approval)',
    engine.evaluate('default', 'shell_exec'),
    'Escalate',
  );
  assertVerdict(
    'vault_op → Escalate',
    engine.evaluate('default', 'vault_op'),
    'Escalate',
  );
  assertVerdict(
    'destructive_write → Denied',
    engine.evaluate('default', 'destructive_write'),
    'Denied',
  );
  assertVerdict(
    'rm_rf → Denied',
    engine.evaluate('default', 'rm_rf'),
    'Denied',
  );
  assertVerdict(
    'unknown_action → Escalate (deny_unknown=false)',
    engine.evaluate('default', 'unknown_action'),
    'Escalate',
  );

  // --- Hardened policy ---
  process.stdout.write('\n[hardened policy]\n');

  assertVerdict(
    'llm_query → Approved',
    engine.evaluate('hardened', 'llm_query'),
    'Approved',
  );
  assertVerdict(
    'profile_switch → Denied (deny_unknown=true)',
    engine.evaluate('hardened', 'profile_switch'),
    'Denied',
  );
  assertVerdict(
    'shell_exec → Denied (deny_unknown=true)',
    engine.evaluate('hardened', 'shell_exec'),
    'Denied',
  );

  // --- Researcher policy ---
  process.stdout.write('\n[researcher policy]\n');

  assertVerdict(
    'llm_query → Approved',
    engine.evaluate('researcher', 'llm_query'),
    'Approved',
  );
  assertVerdict(
    'vault_op_read → Approved',
    engine.evaluate('researcher', 'vault_op_read'),
    'Approved',
  );
  assertVerdict(
    'shell_exec → Denied',
    engine.evaluate('researcher', 'shell_exec'),
    'Denied',
  );
  assertVerdict(
    'unknown_action → Escalate (deny_unknown=false)',
    engine.evaluate('researcher', 'unknown_action'),
    'Escalate',
  );

  // --- Unknown policy ---
  process.stdout.write('\n[unknown policy]\n');
  assertVerdict(
    'any_action → Escalate (unknown policy)',
    engine.evaluate('ghost_policy', 'llm_query'),
    'Escalate',
  );

  // --- Precedence: DENY overrides ESCALATE ─────────────────────────────────
  // Construct a rule where an action is in both denied and escalate
  process.stdout.write('\n[precedence: DENY > ESCALATE]\n');

  const engineWithConflict = new (class extends RuleEngine {
    constructor() {
      super();
      // Override 'default' to have shell_exec in BOTH denied AND escalate
      (this as unknown as { policies: Map<string, PolicyRule> }).policies.set('conflict_test', {
        policy:       'conflict_test',
        allowed:      new Set(),
        denied:       new Set(['shell_exec']),
        escalate:     new Set(['shell_exec']),
        deny_unknown: false,
      });
    }
  })();

  assertVerdict(
    'shell_exec in both denied+escalate → Denied wins',
    engineWithConflict.evaluate('conflict_test', 'shell_exec'),
    'Denied',
  );

  // ── Summary ──────────────────────────────────────────────────────────────
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`GOV-77: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

runGov77();
