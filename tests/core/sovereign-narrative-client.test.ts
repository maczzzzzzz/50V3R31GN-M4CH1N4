/**
 * TDD Tests: SovereignNarrativeClient (Migrated to llama-server)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SovereignNarrativeClient } from '../../src/core/sovereign-narrative-client.js';
import type { SovereignNarrativeConfig } from '../../src/core/interfaces.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  vi.clearAllMocks();
});

function wrapChatResponse(content: string): object {
  return {
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: 1700000000,
    model: 'mistral-nemo-12b',
    choices: [
      {
        index: 0,
        message: { role: 'assistant', content },
        finish_reason: 'stop',
      },
    ],
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  };
}

function mockFetchSuccess(content: string): void {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => wrapChatResponse(content),
  });
}

function mockFetchHttpError(status: number, statusText: string): void {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText,
    json: async () => ({ error: statusText }),
  });
}

function mockFetchNetworkError(): void {
  mockFetch.mockRejectedValueOnce(new TypeError('fetch failed: ECONNREFUSED'));
}

function mockFetchTimeout(): void {
  mockFetch.mockImplementationOnce((_url: string, opts: { signal?: AbortSignal }) => {
    return new Promise((_, reject) => {
      if (opts?.signal) {
        opts.signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      }
    });
  });
}

const baseConfig: SovereignNarrativeConfig = {
  baseUrl: 'http://localhost:8080/v1',
  model: 'mistral-nemo-12b',
  timeoutMs: 5000,
};

describe('SovereignNarrativeClient', () => {
  describe('constructor', () => {
    it('accepts a valid config without throwing', () => {
      expect(() => new SovereignNarrativeClient(baseConfig)).not.toThrow();
    });

    it('throws if baseUrl is empty', () => {
      expect(() => new SovereignNarrativeClient({ ...baseConfig, baseUrl: '' })).toThrow();
    });

    it('throws if model is empty', () => {
      expect(() => new SovereignNarrativeClient({ ...baseConfig, model: '' })).toThrow();
    });

    it('throws if timeoutMs is non-positive', () => {
      expect(() => new SovereignNarrativeClient({ ...baseConfig, timeoutMs: 0 })).toThrow();
      expect(() => new SovereignNarrativeClient({ ...baseConfig, timeoutMs: -1 })).toThrow();
    });
  });

  describe('isHealthy', () => {
    it('returns true when llama-server responds with 200', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      const client = new SovereignNarrativeClient(baseConfig);
      await expect(client.isHealthy()).resolves.toBe(true);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8080/health');
    });

    it('returns false when llama-server is unreachable', async () => {
      mockFetchNetworkError();
      const client = new SovereignNarrativeClient(baseConfig);
      await expect(client.isHealthy()).resolves.toBe(false);
    });
  });

  describe('generateNarrative', () => {
    it('returns the assistant message content on success', async () => {
      const narrative = 'The rain hammers Night City as you step into the Afterlife.';
      mockFetchSuccess(narrative);

      const client = new SovereignNarrativeClient(baseConfig);
      const result = await client.generateNarrative('Set the scene at the Afterlife bar.', '');
      expect(result).toBe(narrative);
    });

    it('sends correct request body to llama-server', async () => {
      mockFetchSuccess('Narrative output');
      const client = new SovereignNarrativeClient(baseConfig);

      await client.generateNarrative('Describe the combat result.', 'Hit: 3d6 → 14 damage');

      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8080/v1/chat/completions');

      const body = JSON.parse(opts.body as string);
      expect(body.model).toBe('mistral-nemo-12b');
      expect(body.stream).toBe(false);
      expect(Array.isArray(body.messages)).toBe(true);
    });

    it('throws on HTTP error with status code in message', async () => {
      mockFetchHttpError(500, 'Internal Server Error');
      const client = new SovereignNarrativeClient(baseConfig);
      await expect(client.generateNarrative('Test', '')).rejects.toThrow('500');
    });
  });
});
