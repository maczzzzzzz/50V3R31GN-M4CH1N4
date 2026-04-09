/**
 * tests/core/rules-grep-service.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RulesGrepService } from '../../src/core/rules-grep-service.js';
import fs from 'node:fs';
import path from 'node:path';

describe('RulesGrepService', () => {
  const testDir = 'tests/fixtures/test_rules';
  let service: RulesGrepService;

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(path.join(testDir, 'combat.md'), 
      'Line 1: Intro\nLine 2: Heavy Pistol DV 13\nLine 3: Range Close\nLine 4: End');
    
    service = new RulesGrepService(testDir);
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should find exact keyword matches with context', async () => {
    const result = await service.search('Heavy Pistol');
    
    expect(result).toContain('--- FROM combat.md ---');
    expect(result).toContain('Line 2: Heavy Pistol DV 13');
    expect(result).toContain('Line 1: Intro'); // Context Line -1
    expect(result).toContain('Line 3: Range Close'); // Context Line +1
  });

  it('should be case-insensitive', async () => {
    const result = await service.search('heavy pistol');
    expect(result).toContain('Line 2: Heavy Pistol DV 13');
  });

  it('should return empty string if no matches found', async () => {
    const result = await service.search('Magic Spell');
    expect(result).toBe('');
  });

  it('should handle missing directory gracefully', async () => {
    const badService = new RulesGrepService('docs/non_existent');
    const result = await badService.search('keyword');
    expect(result).toBe('');
  });
});
