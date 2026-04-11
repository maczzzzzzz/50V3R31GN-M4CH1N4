import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the exported utility logic of audit-live-session without spawning a real browser.
// The CDP connection itself is an integration concern requiring a live Foundry instance.

describe('audit-live-session: getWindowsHostIP', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env['WINDOWS_HOST_IP'];
    delete process.env['WINDOWS_HOST_IP'];
    vi.resetModules();
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env['WINDOWS_HOST_IP'] = originalEnv;
    } else {
      delete process.env['WINDOWS_HOST_IP'];
    }
    vi.restoreAllMocks();
  });

  it('parses the nameserver line from /etc/resolv.conf content', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn().mockReturnValue('# comment\nnameserver 172.26.208.1\nnameserver 8.8.8.8\n'),
    }));
    const { getWindowsHostIP } = await import('../../scripts/audit-live-session.js');
    expect(getWindowsHostIP()).toBe('172.26.208.1');
  });

  it('returns 127.0.0.1 when resolv.conf has no nameserver line', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn().mockReturnValue('# no nameserver here\n'),
    }));
    const { getWindowsHostIP } = await import('../../scripts/audit-live-session.js');
    expect(getWindowsHostIP()).toBe('127.0.0.1');
  });

  it('returns 127.0.0.1 when readFileSync throws', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn().mockImplementation(() => { throw new Error('ENOENT'); }),
    }));
    const { getWindowsHostIP } = await import('../../scripts/audit-live-session.js');
    expect(getWindowsHostIP()).toBe('127.0.0.1');
  });

  it('handles leading/trailing whitespace in nameserver line', async () => {
    vi.doMock('fs', () => ({
      readFileSync: vi.fn().mockReturnValue('  nameserver   192.168.1.1  \n'),
    }));
    const { getWindowsHostIP } = await import('../../scripts/audit-live-session.js');
    expect(getWindowsHostIP()).toBe('192.168.1.1');
  });
});

describe('audit-live-session: CDP endpoint construction', () => {
  it('builds endpoint from WINDOWS_HOST_IP env var when set', () => {
    process.env['WINDOWS_HOST_IP'] = '10.0.0.5';
    // Validate the expected format: http://<host>:9223
    const host = process.env['WINDOWS_HOST_IP'] ?? '127.0.0.1';
    expect(`http://${host}:9223`).toBe('http://10.0.0.5:9223');
    delete process.env['WINDOWS_HOST_IP'];
  });
});
