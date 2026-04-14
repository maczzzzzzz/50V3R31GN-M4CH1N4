import { describe, it, expect, beforeEach } from 'vitest';
import { verifyInteraction, verifyInteractionDetail, auditAllInteractions } from '../../scripts/audit/interaction-auditor.js';

describe('Cross-System Interaction Auditor', () => {
  beforeEach(() => {
    // NanoBanana constructor requires GOOGLE_API_KEY
    process.env['GOOGLE_API_KEY'] = 'test-key-dry-fire';
  });

  it('verifies AtlasForge can call NanoBanana', async () => {
    const passed = await verifyInteraction('AtlasForge', 'NanoBanana');
    expect(passed).toBe(true);
  });

  it('verifies NucleusAssembler can call MotorCortex', async () => {
    const passed = await verifyInteraction('NucleusAssembler', 'MotorCortex');
    expect(passed).toBe(true);
  });

  it('returns false for unknown interaction pair', async () => {
    const passed = await verifyInteraction('Unknown', 'Component');
    expect(passed).toBe(false);
  });

  it('AtlasForge→NanoBanana detail: skeleton PNG exists', async () => {
    const result = await verifyInteractionDetail('AtlasForge', 'NanoBanana');
    expect(result.passed).toBe(true);
    expect(result.checks['skeletonPNG']).toBe('exists');
    expect(result.checks['topologyResolution']).toMatch(/hub resolved/);
  });

  it('NucleusAssembler→MotorCortex detail: manifestSimulation completes', async () => {
    const result = await verifyInteractionDetail('NucleusAssembler', 'MotorCortex');
    expect(result.passed).toBe(true);
    expect(result.checks['manifestSimulation']).toContain('completed');
  });

  it('auditAllInteractions covers all known pairs', async () => {
    const results = await auditAllInteractions();
    expect(results.length).toBeGreaterThanOrEqual(2);
    const allPassed = results.every(r => r.passed);
    expect(allPassed).toBe(true);
  });
});
