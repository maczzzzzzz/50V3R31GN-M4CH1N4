import { describe, it, expect } from 'vitest';
import { ClawLinkConfigSchema } from '../../packages/hermes-core/src/shared/schemas/clawlink.schema.js';

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

  it('includes host or port fields in output', () => {
    const result = ClawLinkConfigSchema.safeParse({
      host: '10.0.0.10',
      port: 7878,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.host).toBe('10.0.0.10');
      expect(result.data.port).toBe(7878);
    }
  });
});
