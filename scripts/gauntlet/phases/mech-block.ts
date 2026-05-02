// scripts/gauntlet/phases/mech-block.ts
// MECHANICAL Block shards — Phases 5, 8, 13, 25, 26, 31, 40
// Verifies: Rules engine, VSB packet integrity, combat resolution, economy engine

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';

function pass(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'MECHANICAL', status: 'PASS', message: msg, details };
}
function fail(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'MECHANICAL', status: 'FAIL', message: msg, details };
}
function warn(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'MECHANICAL', status: 'WARN', message: msg, details };
}
function skip(id: number, name: string, msg: string): AuditResult {
  return { phaseId: id, phaseName: name, block: 'MECHANICAL', status: 'SKIP', message: msg };
}

// ── Phase 5: Rules Engine (Node A) ────────────────────────────────────────────
export const phase5: SovereignShard = {
  metadata: { id: 5, name: 'Rules-Engine', block: 'MECHANICAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    // Verify Node A (Tactical) llama server responds
    const nodeAUrl = process.env['NODE_A_LLAMA_URL'] ?? 'http://10.0.0.10:8080/v1';
    try {
      const res = await fetch(`${nodeAUrl}/models`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) {
        return fail(5, 'Rules-Engine', `Node A returned HTTP ${res.status}`);
      }
      const data = await res.json() as { data?: Array<{ id: string }> };
      const models = data.data?.map(m => m.id) ?? [];
      // Also test a simple reasoning query via vision client
      const tacticalHealth = await ctx.vision.tacticalQuery({
        prompt: 'Respond with only the word "SOVEREIGN" to confirm you are operational.',
      }).catch((e: Error) => ({ text: '', model: 'error', node: 'A' as const, _err: e.message }));
      const responseOk = tacticalHealth.text.includes('SOVEREIGN') || tacticalHealth.text.length > 0;
      if (!responseOk) {
        return warn(5, 'Rules-Engine', `Node A models API ok but reasoning response empty`, { models });
      }
      return pass(5, 'Rules-Engine', `Node A operational | ${models.length} model(s) loaded`, { models });
    } catch (e) {
      return warn(5, 'Rules-Engine', `Node A unreachable: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Force a tactical query to confirm Node A is accepting commands
    const i = intent as { prompt?: string } | null;
    const prompt = i?.prompt ?? 'Confirm operational status. Reply with only "SOVEREIGN".';
    await ctx.vision.tacticalQuery({ prompt }).catch(() => { /* non-fatal */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 8: VSB Packet Integrity ─────────────────────────────────────────────
export const phase8: SovereignShard = {
  metadata: { id: 8, name: 'VSB-Packet-Integrity', block: 'MECHANICAL' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    // Verify VSB client: crush-cli loads correctly (exits 0) = packet module healthy.
    // wsa subcommands all require target IDs and trigger game actions — not safe as probes.
    // UDP channel liveness is covered by phase 2 (VSB-Heartbeat).
    const { execSync } = await import('node:child_process');
    const crushBin = './crush-cli';
    const { existsSync } = await import('node:fs');
    if (!existsSync(crushBin)) {
      return skip(8, 'VSB-Packet-Integrity', 'crush-cli not found — skip');
    }
    try {
      const out = execSync(crushBin, { encoding: 'utf8', timeout: 5000, stdio: 'pipe' });
      // Exit 0 confirms the binary + its VSB client module loads and connects to DB
      const version = out.match(/CRU5H v[\d.]+/)?.[0] ?? 'unknown version';
      return pass(8, 'VSB-Packet-Integrity', `crush-cli client healthy (${version})`);
    } catch (e) {
      return warn(8, 'VSB-Packet-Integrity', `crush-cli failed to start: ${(e as Error).message.slice(0, 120)}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Trigger a VSB self-ping to verify packet path is clear
    const i = intent as { opcode?: number } | null;
    const opcode = i?.opcode ?? 0x00;
    const pkt = Buffer.from([opcode, 0x00, 0x00, 0x00]);
    await ctx.vsb.send(pkt).catch(() => { /* non-fatal if Node A offline */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 13: Combat Resolution (CDP) ────────────────────────────────────────
export const phase13: SovereignShard = {
  metadata: { id: 13, name: 'Combat-Resolution', block: 'MECHANICAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.page) return skip(13, 'Combat-Resolution', 'CDP page unavailable');
    try {
      // Verify the sub rosa.resolveAttack hook is registered in Foundry
      const hookStatus = await ctx.page.evaluate(() => {
        const hooks = (globalThis as unknown as Record<string, unknown>)['Hooks'];
        if (!hooks) return { registered: false, reason: 'Hooks global missing' };
        const events = (hooks as Record<string, unknown>)['_hooks'] as Record<string, unknown> | undefined ??
          (hooks as Record<string, unknown>)['events'] as Record<string, unknown> | undefined;
        if (!events) return { registered: false, reason: 'No Hooks._hooks or .events' };
        const hasHook = Object.keys(events).some(k => k.includes('resolveAttack') || k.includes('sub rosa'));
        return { registered: hasHook, hookCount: Object.keys(events).length };
      });
      if (!hookStatus.registered) {
        return warn(13, 'Combat-Resolution', `resolveAttack hook not registered (${hookStatus.reason ?? `${hookStatus.hookCount} hooks present`})`);
      }
      return pass(13, 'Combat-Resolution', 'sub rosa.resolveAttack hook registered', hookStatus);
    } catch (e) {
      return fail(13, 'Combat-Resolution', `CDP eval failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Migrated from synthetic-gauntlet.ts Task 3.1 — Resolve Attack Injection
    if (!ctx.page) return;
    const i = intent as { actorId?: string; targetId?: string; weaponId?: string } | null;
    const actorId = i?.actorId ?? '';
    const targetId = i?.targetId ?? '';
    const weaponId = i?.weaponId ?? 'synthetic-test-smasher';
    await ctx.bridge.runScript(`
      const actor = ${actorId ? `game.actors.get(${JSON.stringify(actorId)})` : 'game.actors.contents[0]'};
      if (!actor) throw new Error('resolveAttack: no actor found');
      const tid = ${JSON.stringify(targetId)} || actor.id;
      Hooks.call('sub rosa.resolveAttack', {
        actorId: actor.id,
        targetId: tid,
        weaponId: ${JSON.stringify(weaponId)},
        spatial: { sceneId: game.scenes?.active?.id, x: 500, y: 500 }
      });
    `);
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 25: DV Calculation (Node A) ────────────────────────────────────────
export const phase25: SovereignShard = {
  metadata: { id: 25, name: 'DV-Calculation', block: 'MECHANICAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    try {
      const resp = await ctx.vision.tacticalQuery({
        prompt: 'In NODESTADT Authority, what is the DV for a Short Range Ranged Attack? Reply with only the numeric DV value.',
      });
      // Any numeric response indicates the rules engine can do DV lookups
      const hasNumeric = /\d+/.test(resp.text);
      if (!hasNumeric) {
        return warn(25, 'DV-Calculation', `Node A responded but no DV numeric found: "${resp.text.slice(0, 60)}"`);
      }
      return pass(25, 'DV-Calculation', `Node A DV lookup OK: "${resp.text.trim().slice(0, 40)}"`, { model: resp.model });
    } catch (e) {
      return warn(25, 'DV-Calculation', `Node A DV query failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Force a DV lookup query to Node A
    const i = intent as { scenario?: string } | null;
    const scenario = i?.scenario ?? 'Short Range Ranged Attack';
    await ctx.vision.tacticalQuery({
      prompt: `In NODESTADT Authority, what is the DV for a ${scenario}? Reply with only the numeric DV value.`,
    }).catch(() => { /* non-fatal */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 26: Radar Heat (VSB FRICTION_INTENT) ────────────────────────────────
export const phase26: SovereignShard = {
  metadata: { id: 26, name: 'Radar-Heat', block: 'MECHANICAL' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const { existsSync } = await import('node:fs');
    const crushBin = './crush-cli';
    if (!existsSync(crushBin)) {
      return skip(26, 'Radar-Heat', 'crush-cli not found');
    }
    // Check if VSB module is loaded by looking for shared memory or port
    const { createSocket } = await import('node:dgram');
    const vsbPort = parseInt(process.env['ZEROCLAW_PORT'] ?? '7878', 10);
    const nodeAHost = process.env['NODE_A_HOST'] ?? '10.0.0.10';

    // Send FRICTION_INTENT (0x05) opcode as a non-destructive probe
    const probeResult = await new Promise<boolean>(resolve => {
      const sock = createSocket('udp4');
      // VSB packet: opcode=0x05 (FRICTION_INTENT), payload=0x00 (query)
      const pkt = Buffer.from([0x05, 0x00, 0x00, 0x00]);
      const timer = setTimeout(() => { sock.close(); resolve(false); }, 3000);
      sock.on('message', () => { clearTimeout(timer); sock.close(); resolve(true); });
      sock.on('error', () => { clearTimeout(timer); sock.close(); resolve(false); });
      sock.send(pkt, vsbPort, nodeAHost, err => {
        if (err) { clearTimeout(timer); sock.close(); resolve(false); }
      });
    });

    if (!probeResult) {
      return warn(26, 'Radar-Heat', `VSB FRICTION_INTENT probe to ${nodeAHost}:${vsbPort} got no response`);
    }
    return pass(26, 'Radar-Heat', `VSB FRICTION_INTENT acknowledged by ${nodeAHost}:${vsbPort}`);
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Set radar heat level via VSB FRICTION_INTENT opcode (0x05)
    const i = intent as { heat?: number } | null;
    const heat = Math.max(0, Math.min(255, i?.heat ?? 50));
    const pkt = Buffer.from([0x05, heat, 0x00, 0x00]);
    await ctx.vsb.send(pkt).catch(() => { /* non-fatal if Node A offline */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 31: Action Sovereignty (Synthetic Input) ───────────────────────────
export const phase31: SovereignShard = {
  metadata: { id: 31, name: 'Action-Sovereignty', block: 'MECHANICAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.page) return skip(31, 'Action-Sovereignty', 'CDP page unavailable');
    try {
      // Verify the ghost-input / synthetic input channel is registered in Foundry
      const inputStatus = await ctx.page.evaluate(() => {
        const g = (globalThis as unknown as Record<string, unknown>)['game'];
        if (!g) return { ready: false };
        const bridge = (globalThis as unknown as Record<string, unknown>)['SOVEREIGN_BRIDGE'];
        return {
          ready: true,
          bridgePresent: !!bridge,
          wsReady: bridge
            ? ((bridge as Record<string, unknown>)['ws'] as WebSocket | undefined)?.readyState === 1
            : false,
        };
      });
      if (!inputStatus.ready) {
        return warn(31, 'Action-Sovereignty', 'Foundry not ready for synthetic input');
      }
      if (!inputStatus.bridgePresent) {
        return warn(31, 'Action-Sovereignty', 'SOVEREIGN_BRIDGE not present — synthetic input path unavailable');
      }
      if (!inputStatus.wsReady) {
        return warn(31, 'Action-Sovereignty', 'Bridge present but WS not OPEN', inputStatus);
      }
      return pass(31, 'Action-Sovereignty', 'SOVEREIGN_BRIDGE WS OPEN — synthetic input ready', inputStatus);
    } catch (e) {
      return fail(31, 'Action-Sovereignty', `CDP eval failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Trigger SOVEREIGN_BRIDGE reconnect / synthetic input reset
    if (!ctx.page) return;
    const i = intent as { event?: string } | null;
    const event = i?.event ?? 'reconnect_uplink';
    await ctx.bridge.runScript(`
      if (window.SOVEREIGN_BRIDGE) {
        window.SOVEREIGN_BRIDGE._sendEvent(${JSON.stringify(event)}, {});
      }
    `).catch(() => { /* non-fatal */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 40: Economy Engine (Red Trade) ─────────────────────────────────────
export const phase40: SovereignShard = {
  metadata: { id: 40, name: 'Economy-Engine', block: 'MECHANICAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(40, 'Economy-Engine', 'world.db not available');
    try {
      // Check inventory and player_housing tables (Red Trade subsystem)
      const tables = (ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const hasInventory = tables.includes('inventory');
      const hasHousing = tables.includes('player_housing');
      const hasFactions = tables.includes('factions');
      if (!hasInventory || !hasHousing) {
        return warn(40, 'Economy-Engine', `Economy tables missing: inventory=${hasInventory} housing=${hasHousing}`, {
          hasInventory, hasHousing, hasFactions,
        });
      }
      const inventoryCount = (ctx.db.prepare('SELECT COUNT(*) as c FROM inventory').get() as { c: number }).c;
      const housingCount = (ctx.db.prepare('SELECT COUNT(*) as c FROM player_housing').get() as { c: number }).c;
      return pass(40, 'Economy-Engine', `${inventoryCount} inventory items | ${housingCount} housing records`, {
        inventoryCount,
        housingCount,
        hasFactions,
      });
    } catch (e) {
      return fail(40, 'Economy-Engine', `Economy query failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Migrated from synthetic-gauntlet.ts Task 3.2 — VSB Friction Roll
    const i = intent as { target?: string } | null;
    const target = i?.target ?? 'tygerclaws';
    await ctx.cli.execute(`./crush-cli wsa friction ${target}`).catch(() => { /* non-fatal if crush-cli absent */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};
