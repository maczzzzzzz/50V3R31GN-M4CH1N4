import { describe, it, expect } from 'vitest';
import { ClawLinkConfigSchema } from '../../src/shared/schemas/clawlink.schema.js';

describe('ClawLinkConfigSchema', () => {
  it('accepts socketPath and applies default', () => {
    const result = ClawLinkConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.socketPath).toBe('/run/crush/clawlink.sock');
    }
  });

  it('accepts explicit socketPath', () => {
    const result = ClawLinkConfigSchema.safeParse({ socketPath: '/tmp/test.sock' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.socketPath).toBe('/tmp/test.sock');
    }
  });

  it('rejects empty socketPath', () => {
    const result = ClawLinkConfigSchema.safeParse({ socketPath: '' });
    expect(result.success).toBe(false);
  });

  it('does not include host or port fields in output', () => {
    const result = ClawLinkConfigSchema.safeParse({
      host: '192.168.0.50',
      port: 7878,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>)['host']).toBeUndefined();
      expect((result.data as Record<string, unknown>)['port']).toBeUndefined();
    }
  });
});
