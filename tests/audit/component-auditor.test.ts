import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkComponentState, auditAllComponents } from '../../scripts/audit/component-auditor.js';

describe('Component Auditor', () => {
  let savedKey: string | undefined;

  beforeEach(() => {
    savedKey = process.env['GOOGLE_API_KEY'];
    // Provide a fake key so NanoBanana constructor does not throw
    process.env['GOOGLE_API_KEY'] = 'test-key-dry-fire';
    vi.resetModules();
  });

  afterEach(() => {
    if (savedKey !== undefined) {
      process.env['GOOGLE_API_KEY'] = savedKey;
    } else {
      delete process.env['GOOGLE_API_KEY'];
    }
  });

  it('verifies NanoBanana component state with API key present', async () => {
    const result = await checkComponentState('NanoBanana');
    expect(result.component).toBe('NanoBanana');
    // With GOOGLE_API_KEY set, status must be OK (not FAIL)
    expect(result.status).not.toBe('FAIL');
    expect(result.checks['GOOGLE_API_KEY']).toBe('present');
  });

  it('returns WARN for NanoBanana when API key is missing', async () => {
    delete process.env['GOOGLE_API_KEY'];
    const result = await checkComponentState('NanoBanana');
    expect(result.status).toBe('WARN');
    expect(result.checks['GOOGLE_API_KEY']).toBe('missing');
  });

  it('verifies AtlasForge component state', async () => {
    const result = await checkComponentState('AtlasForge');
    expect(result.component).toBe('AtlasForge');
    expect(result.status).toBe('OK');
    expect(result.checks['topologyLib']).toMatch(/\d+ tiles/);
    expect(result.checks['requiredTiles']).toContain('present');
  });

  it('verifies NucleusAssembler component state', async () => {
    const result = await checkComponentState('NucleusAssembler');
    expect(result.component).toBe('NucleusAssembler');
    expect(result.status).toBe('OK');
    expect(result.checks['instantiation']).toBe('OK');
  });

  it('verifies AkashikDB is reachable', async () => {
    const result = await checkComponentState('AkashikDB');
    expect(result.component).toBe('AkashikDB');
    expect(result.status).toBe('OK');
    expect(result.checks['tables']).toMatch(/\d+ tables/);
  });

  it('returns FAIL for unknown component', async () => {
    const result = await checkComponentState('UnknownWidget');
    expect(result.status).toBe('FAIL');
  });

  it('auditAllComponents returns a result for every known component', async () => {
    const results = await auditAllComponents();
    expect(results.length).toBeGreaterThanOrEqual(4);
    const names = results.map(r => r.component);
    expect(names).toContain('NanoBanana');
    expect(names).toContain('AtlasForge');
    expect(names).toContain('NucleusAssembler');
    expect(names).toContain('AkashikDB');
    // None should be FAIL (WARN is acceptable for missing API key in some envs)
    for (const r of results) {
      expect(r.status).not.toBe('FAIL');
    }
  });
});
