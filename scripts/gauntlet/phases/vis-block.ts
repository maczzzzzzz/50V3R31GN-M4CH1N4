// scripts/gauntlet/phases/vis-block.ts
// VISUAL Block shards — Phases 11, 14, 16, 35, 42
// Verifies: CSS injection, canvas rendering, overlays, Node B aesthetic, audit logs

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync, readdirSync } from 'node:fs';

function pass(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'VISUAL', status: 'PASS', message: msg, details };
}
function fail(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'VISUAL', status: 'FAIL', message: msg, details };
}
function warn(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'VISUAL', status: 'WARN', message: msg, details };
}
function skip(id: number, name: string, msg: string): AuditResult {
  return { phaseId: id, phaseName: name, block: 'VISUAL', status: 'SKIP', message: msg };
}

// ── Phase 11: CSS Injection ───────────────────────────────────────────────────
export const phase11: SovereignShard = {
  metadata: { id: 11, name: 'CSS-Injection', block: 'VISUAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.page) return skip(11, 'CSS-Injection', 'CDP page unavailable');
    try {
      const cssStatus = await ctx.page.evaluate(() => {
        // Look for our Black Ice theme stylesheet
        const sheets = Array.from(document.styleSheets);
        const sovereign = sheets.find(s => s.href?.includes('black-ice') || s.href?.includes('sovereign'));
        // Check critical CSS vars
        const rootStyle = getComputedStyle(document.documentElement);
        const primaryColor = rootStyle.getPropertyValue('--color-text-primary') || rootStyle.getPropertyValue('--sovereign-primary');
        const bodyBg = getComputedStyle(document.body).backgroundColor;
        return {
          sovereignSheetFound: !!sovereign,
          sovereignSheetHref: sovereign?.href ?? null,
          sheetCount: sheets.length,
          bodyBg,
          primaryColor: primaryColor.trim(),
          hasVttClass: document.body.classList.contains('vtt'),
        };
      });
      const whiteBackground = cssStatus.bodyBg.includes('255, 255, 255') || cssStatus.bodyBg === 'rgb(255, 255, 255)';
      if (whiteBackground) {
        return fail(11, 'CSS-Injection', `WHITE body background detected: ${cssStatus.bodyBg}`, cssStatus);
      }
      if (!cssStatus.sovereignSheetFound) {
        return warn(11, 'CSS-Injection', `Sovereign CSS sheet not found (${cssStatus.sheetCount} sheets loaded)`, cssStatus);
      }
      return pass(11, 'CSS-Injection', `CSS injected | body=${cssStatus.bodyBg} | ${cssStatus.sheetCount} sheets`, cssStatus);
    } catch (e) {
      return fail(11, 'CSS-Injection', `CDP eval failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Enforce Sovereign CSS theme via bridge injection
    if (!ctx.page) return;
    const i = intent as { css?: string } | null;
    const css = i?.css ?? ':root { --sovereign-primary: #00ff41; } body { background: #0a0a0a !important; }';
    await ctx.bridge.injectCSS(css).catch(() => { /* non-fatal */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 14: Canvas Rendering ────────────────────────────────────────────────
export const phase14: SovereignShard = {
  metadata: { id: 14, name: 'Canvas-Rendering', block: 'VISUAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.page) return skip(14, 'Canvas-Rendering', 'CDP page unavailable');
    try {
      const canvasStatus = await ctx.page.evaluate(() => {
        const canvas = document.querySelector('#board, canvas#board, canvas.pixi-canvas, canvas') as HTMLCanvasElement | null;
        if (!canvas) return { found: false };
        const ctx2d = canvas.width > 0 && canvas.height > 0;
        // Check if PIXI/game canvas is rendering
        const g = (globalThis as unknown as Record<string, unknown>)['game'];
        const hasCanvas = !!(g && (g as Record<string, unknown>)['canvas']);
        return {
          found: true,
          width: canvas.width,
          height: canvas.height,
          hasSize: ctx2d,
          gameCanvasPresent: hasCanvas,
        };
      });
      if (!canvasStatus.found) {
        return warn(14, 'Canvas-Rendering', 'No canvas element found — scene may not be active');
      }
      if (!canvasStatus.hasSize) {
        return warn(14, 'Canvas-Rendering', 'Canvas found but has zero dimensions', canvasStatus);
      }
      return pass(14, 'Canvas-Rendering', `Canvas ${canvasStatus.width}×${canvasStatus.height} | game.canvas=${canvasStatus.gameCanvasPresent}`, canvasStatus);
    } catch (e) {
      return fail(14, 'Canvas-Rendering', `CDP eval failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Force canvas redraw by toggling scene visibility via bridge
    if (!ctx.page) return;
    const i = intent as { sceneId?: string } | null;
    const sceneId = i?.sceneId ?? '';
    await ctx.bridge.runScript(`
      const scene = ${sceneId ? `game.scenes.get(${JSON.stringify(sceneId)})` : 'game.scenes.active'};
      if (scene && canvas.ready) { canvas.draw(scene).catch(() => {}); }
    `).catch(() => { /* non-fatal */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 16: Overlay Presence ────────────────────────────────────────────────
export const phase16: SovereignShard = {
  metadata: { id: 16, name: 'Overlay-Presence', block: 'VISUAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.page) return skip(16, 'Overlay-Presence', 'CDP page unavailable');
    try {
      const overlayStatus = await ctx.page.evaluate(() => {
        // Check for Sovereign overlay elements
        const overlayIds = ['#neural-shroud-lock', '#sovereign-overlay', '#pretext-overlay', '.sovereign-hud'];
        const found = overlayIds.map(sel => ({
          selector: sel,
          present: !!document.querySelector(sel),
        }));
        // Check Notifications area (used by bridge for overlay dispatch)
        const notifications = document.querySelector('#notifications');
        // Check SOVEREIGN_BRIDGE overlay method exists
        const bridge = (globalThis as unknown as Record<string, unknown>)['SOVEREIGN_BRIDGE'];
        const hasOverlayMethod = !!(bridge && typeof (bridge as Record<string, unknown>)['showErrorOverlay'] === 'function');
        return { overlayElements: found, notificationsPresent: !!notifications, hasOverlayMethod };
      });

      const activeOverlays = overlayStatus.overlayElements.filter(o => o.present);
      const details: Record<string, unknown> = {
        activeOverlays: activeOverlays.map(o => o.selector),
        notificationsPresent: overlayStatus.notificationsPresent,
        hasOverlayMethod: overlayStatus.hasOverlayMethod,
      };

      if (!overlayStatus.hasOverlayMethod) {
        return warn(16, 'Overlay-Presence', 'SOVEREIGN_BRIDGE.showErrorOverlay not found', details);
      }
      return pass(16, 'Overlay-Presence',
        `Overlay infrastructure ready | active=${activeOverlays.length} | bridge.showErrorOverlay=✓`,
        details,
      );
    } catch (e) {
      return fail(16, 'Overlay-Presence', `CDP eval failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Migrated from synthetic-gauntlet.ts Task 3.3 — Neural Shroud Validation
    const i = intent as { intensity?: string } | null;
    const intensity = i?.intensity ?? 'heavy';
    await ctx.cli.execute(`./crush-cli intent ${intensity}`).catch(() => { /* non-fatal if crush-cli absent */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 35: Visual Dominance (Node B Aesthetic Eye) ────────────────────────
export const phase35: SovereignShard = {
  metadata: { id: 35, name: 'Visual-Dominance', block: 'VISUAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    // First verify Node B is online
    const health = await ctx.vision.healthCheck().catch(() => ({ nodeA: false, nodeB: false }));
    if (!health.nodeB) {
      return warn(35, 'Visual-Dominance', 'Node B (Aesthetic Eye / Pixtral) offline');
    }

    if (!ctx.page) {
      // Node B online but no page — partial pass
      return pass(35, 'Visual-Dominance', 'Node B online | no CDP page for screenshot analysis', { nodeB: true });
    }

    try {
      // Capture screenshot and query Node B for theme leak detection
      const response = await ctx.vision.analyzePageAesthetics(
        ctx.page,
        'Analyze this Foundry VTT screenshot for UI theme issues. ' +
        'Check if there are any bright white backgrounds in windows or panels. ' +
        'Respond in one sentence: either "THEME_CLEAN" if the theme looks dark/cyberpunk, ' +
        'or "THEME_LEAK: <description>" if white/bright backgrounds are visible.',
      );

      const text = response.text.trim();
      const hasLeak = text.includes('THEME_LEAK') || text.toLowerCase().includes('white background');
      if (hasLeak) {
        return warn(35, 'Visual-Dominance', `Node B detected theme leak: ${text.slice(0, 120)}`, { analysis: text });
      }
      return pass(35, 'Visual-Dominance', `Node B aesthetic check: ${text.slice(0, 80)}`, { analysis: text });
    } catch (e) {
      return warn(35, 'Visual-Dominance', `Aesthetic analysis failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    // Trigger a Node B aesthetic analysis of the current page
    if (!ctx.page) return;
    const i = intent as { prompt?: string } | null;
    const prompt = i?.prompt ??
      'Analyze this Foundry VTT screenshot. Reply with "THEME_CLEAN" or "THEME_LEAK: <reason>".';
    await ctx.vision.analyzePageAesthetics(ctx.page, prompt).catch(() => { /* non-fatal */ });
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 42: Audit Infrastructure ───────────────────────────────────────────
export const phase42: SovereignShard = {
  metadata: { id: 42, name: 'Audit-Infrastructure', block: 'VISUAL' },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const logDir = './data/logs';
    if (!existsSync(logDir)) {
      return fail(42, 'Audit-Infrastructure', `Log directory ${logDir} does not exist`);
    }
    try {
      const files = readdirSync(logDir);
      const auditLogs = files.filter(f => f.startsWith('audit-run-') || f.includes('audit') || f.includes('gauntlet'));
      const hasPngs = files.some(f => f.endsWith('.png'));
      const details: Record<string, unknown> = {
        totalFiles: files.length,
        auditLogCount: auditLogs.length,
        hasPngBaseline: hasPngs,
        recentLogs: auditLogs.slice(-5),
      };
      if (auditLogs.length === 0) {
        return warn(42, 'Audit-Infrastructure', `Log dir exists but no audit logs found (${files.length} files total)`, details);
      }
      return pass(42, 'Audit-Infrastructure', `${auditLogs.length} audit log(s) | PNG baseline=${hasPngs}`, details);
    } catch (e) {
      return fail(42, 'Audit-Infrastructure', `Log directory read failed: ${(e as Error).message}`);
    }
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    // Ensure log directory and baseline symlinks are present
    const { mkdirSync } = await import('node:fs');
    mkdirSync('./data/logs', { recursive: true });
    ctx.logger.info('Audit-Infrastructure manifest: log directory ensured');
  },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 44.5: Sovereign Shroud Integrity ────────────────────────────────────
// Verifies the Master Shroud PIXI container, Space Grotesk BitmapText, and GLSL shader
// uniforms (uScanlineAlpha, uGlitchIntensity) per the Sovereign Shroud design spec.
export const phase44_5: SovereignShard = {
  metadata: { id: 44.5, name: 'Sovereign-Shroud', block: 'VISUAL' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.page) return { phaseId: 44.5, phaseName: 'Sovereign-Shroud', block: 'VISUAL', status: 'SKIP', message: 'CDP page unavailable' };

    try {
      const shroudStatus = await ctx.page.evaluate(() => {
        const g = globalThis as unknown as Record<string, unknown>;
        const pretextManager = g['PretextOverlayManager'] ?? g['PRETEXT_OVERLAY_MANAGER'];
        const hasPretextManager = !!pretextManager;

        const pixi = (g['PIXI'] ?? g['pixi']) as Record<string, unknown> | undefined;
        const hasPIXI = !!pixi;
        const hasBitmapText = !!(pixi?.['BitmapText']);

        const canvas = g['canvas'] as Record<string, unknown> | undefined;
        const interfaceLayer = canvas?.['interface'] as Record<string, unknown> | undefined;
        const children = (interfaceLayer?.['children'] as unknown[]) ?? [];

        let hasShoudContainer = false;
        let hasScanlineUniform = false;
        let hasGlitchUniform = false;

        for (const child of children) {
          const c = child as Record<string, unknown>;
          if (c['label'] === 'SovereignShroud' || c['name'] === 'SovereignShroud') {
            hasShoudContainer = true;
            const filters = (c['filters'] as Array<Record<string, unknown>>) ?? [];
            for (const f of filters) {
              const uniforms = f['uniforms'] as Record<string, unknown> | undefined;
              if (uniforms?.['uScanlineAlpha'] !== undefined) hasScanlineUniform = true;
              if (uniforms?.['uGlitchIntensity'] !== undefined) hasGlitchUniform = true;
            }
          }
        }

        return { hasPretextManager, hasPIXI, hasBitmapText, canvasReady: !!canvas?.['ready'],
          hasShoudContainer, hasScanlineUniform, hasGlitchUniform };
      });

      const details = shroudStatus as Record<string, unknown>;

      if (!shroudStatus.hasPretextManager && !shroudStatus.hasShoudContainer) {
        return { phaseId: 44.5, phaseName: 'Sovereign-Shroud', block: 'VISUAL', status: 'WARN',
          message: 'PretextOverlayManager absent — Shroud not yet instantiated (Phase 44.5 pre-implementation)', details };
      }
      if (shroudStatus.hasShoudContainer && !shroudStatus.hasScanlineUniform) {
        return { phaseId: 44.5, phaseName: 'Sovereign-Shroud', block: 'VISUAL', status: 'WARN',
          message: 'Shroud container present but uScanlineAlpha shader uniform missing', details };
      }
      if (!shroudStatus.hasBitmapText) {
        return { phaseId: 44.5, phaseName: 'Sovereign-Shroud', block: 'VISUAL', status: 'WARN',
          message: `Shroud ${shroudStatus.hasShoudContainer ? 'present' : 'absent'} | PIXI.BitmapText (Space Grotesk) not confirmed`, details };
      }

      return { phaseId: 44.5, phaseName: 'Sovereign-Shroud', block: 'VISUAL', status: 'PASS',
        message: `Shroud ONLINE | BitmapText=✓ scanline=${shroudStatus.hasScanlineUniform ? '✓' : '✗'} glitch=${shroudStatus.hasGlitchUniform ? '✓' : '✗'}`,
        details };
    } catch (e) {
      return { phaseId: 44.5, phaseName: 'Sovereign-Shroud', block: 'VISUAL', status: 'FAIL',
        message: `CDP eval failed: ${(e as Error).message}` };
    }
  },

  async manifest(ctx: GauntletContext, intent: unknown): Promise<void> {
    if (!ctx.page) return;
    const i = intent as { text?: string; glitchIntensity?: number } | null;
    const text = i?.text ?? 'S0VER31GN_SHROUD_TEST';
    const intensity = i?.glitchIntensity ?? 0.3;
    await ctx.bridge.runScript(`
      const bridge = window.SOVEREIGN_BRIDGE;
      if (bridge && typeof bridge._sendEvent === 'function') {
        bridge._sendEvent('pretext_overlay', { text: ${JSON.stringify(text)}, duration: 3000 });
        bridge._sendEvent('pretext_glitch_impulse', { intensity: ${intensity} });
      }
    `).catch(() => { /* non-fatal */ });
  },

  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};
