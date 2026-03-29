import { describe, it, expect } from 'vitest';
import { PdfChunkSchema, NamespaceEnum } from '../../src/shared/schemas/pdf-chunk.schema.js';

describe('PdfChunkSchema', () => {
  it('validates a well-formed core rules chunk', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-CyberpunkRedCore.pdf',
      namespace: 'core_rules',
      sectionHeading: 'Friday Night Firefight > Actions > Move Action',
      pageStart: 169,
      pageEnd: 170,
      content: 'Every Turn, a Character gets a Move Action, which can only be used to move a number of m/yds equal to their MOVE x 2.',
      chunkIndex: 0,
      tokenEstimate: 42,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(true);
  });

  it('validates a Black Chrome chunk', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-BlackChrome.pdf',
      namespace: 'core_rules',
      sectionHeading: 'Weapons > Assault Rifles',
      pageStart: 85,
      pageEnd: 87,
      content: 'Assault rifles are the standard for corporate security forces.',
      chunkIndex: 3,
      tokenEstimate: 18,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(true);
  });

  it('rejects a chunk with invalid namespace', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-CyberpunkRedCore.pdf',
      namespace: 'invalid_namespace',
      sectionHeading: 'Test',
      pageStart: 1,
      pageEnd: 1,
      content: 'test',
      chunkIndex: 0,
      tokenEstimate: 1,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(false);
  });

  it('rejects a chunk with missing content', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-CyberpunkRedCore.pdf',
      namespace: 'core_rules',
      sectionHeading: 'Test',
      pageStart: 1,
      pageEnd: 1,
      chunkIndex: 0,
      tokenEstimate: 0,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(false);
  });

  it('rejects a chunk with negative page numbers', () => {
    const chunk = {
      sourceFile: 'RTG-CPR-CyberpunkRedCore.pdf',
      namespace: 'core_rules',
      sectionHeading: 'Test',
      pageStart: -1,
      pageEnd: 1,
      content: 'test',
      chunkIndex: 0,
      tokenEstimate: 1,
    };
    const result = PdfChunkSchema.safeParse(chunk);
    expect(result.success).toBe(false);
  });

  it('exports all three valid namespaces', () => {
    const namespaces = NamespaceEnum.options;
    expect(namespaces).toContain('core_rules');
    expect(namespaces).toContain('campaign_ttta');
    expect(namespaces).toContain('entities_mooks');
    expect(namespaces).toHaveLength(3);
  });
});
