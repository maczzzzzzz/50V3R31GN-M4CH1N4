/**
 * TDD Tests: OllamaClient
 *
 * Tests for the Node B narrative synthesis client targeting Mistral-Nemo 12B
 * via Ollama's OpenAI-compatible /v1/chat/completions endpoint.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OllamaClient } from '../../src/core/ollama-client.js';
import type { OllamaConfig } from '../../src/core/interfaces.js';

// ── Mock fetch ────────────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  vi.clearAllMocks();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function wrapChatResponse(content: string): object {
  return {
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: 1700000000,
    model: 'mistral-nemo:latest',
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

// ── Base config ───────────────────────────────────────────────────────────────

const baseConfig: OllamaConfig = {
  baseUrl: 'http://localhost:11434/v1',
  model: 'mistral-nemo:latest',
  timeoutMs: 5000,
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('OllamaClient', () => {

  // ── Constructor validation ──────────────────────────────────────────────────

  describe('constructor', () => {
    it('accepts a valid config without throwing', () => {
      expect(() => new OllamaClient(baseConfig)).not.toThrow();
    });

    it('throws if baseUrl is empty', () => {
      expect(() => new OllamaClient({ ...baseConfig, baseUrl: '' })).toThrow();
    });

    it('throws if model is empty', () => {
      expect(() => new OllamaClient({ ...baseConfig, model: '' })).toThrow();
    });

    it('throws if timeoutMs is non-positive', () => {
      expect(() => new OllamaClient({ ...baseConfig, timeoutMs: 0 })).toThrow();
      expect(() => new OllamaClient({ ...baseConfig, timeoutMs: -1 })).toThrow();
    });
  });

  // ── isHealthy ───────────────────────────────────────────────────────────────

  describe('isHealthy', () => {
    it('returns true when Ollama responds with 200', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ models: [] }) });
      const client = new OllamaClient(baseConfig);
      await expect(client.isHealthy()).resolves.toBe(true);
    });

    it('returns false when Ollama is unreachable', async () => {
      mockFetchNetworkError();
      const client = new OllamaClient(baseConfig);
      await expect(client.isHealthy()).resolves.toBe(false);
    });

    it('returns false on HTTP error', async () => {
      mockFetchHttpError(503, 'Service Unavailable');
      const client = new OllamaClient(baseConfig);
      await expect(client.isHealthy()).resolves.toBe(false);
    });
  });

  // ── generateNarrative ───────────────────────────────────────────────────────

  describe('generateNarrative', () => {
    it('returns the assistant message content on success', async () => {
      const narrative = 'The rain hammers Night City as you step into the Afterlife.';
      mockFetchSuccess(narrative);

      const client = new OllamaClient(baseConfig);
      const result = await client.generateNarrative('Set the scene at the Afterlife bar.', '');
      expect(result).toBe(narrative);
    });

    it('sends correct request body to Ollama', async () => {
      mockFetchSuccess('Narrative output');
      const client = new OllamaClient(baseConfig);

      await client.generateNarrative('Describe the combat result.', 'Hit: 3d6 → 14 damage');

      const [url, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:11434/v1/chat/completions');

      const body = JSON.parse(opts.body as string);
      expect(body.model).toBe('mistral-nemo:latest');
      expect(body.stream).toBe(false);
      expect(Array.isArray(body.messages)).toBe(true);

      // System prompt must exist
      const systemMsg = body.messages.find((m: { role: string }) => m.role === 'system');
      expect(systemMsg).toBeDefined();

      // User message must include the prompt
      const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
      expect(userMsg).toBeDefined();
      expect(userMsg.content).toContain('Describe the combat result.');
    });

    it('injects combat context into the user message when provided', async () => {
      mockFetchSuccess('Combat narrative');
      const client = new OllamaClient(baseConfig);

      await client.generateNarrative('Narrate the attack.', 'Hit: netDamage=8, crit=false');

      const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(opts.body as string);
      const userMsg = body.messages.find((m: { role: string }) => m.role === 'user');
      expect(userMsg.content).toContain('Hit: netDamage=8, crit=false');
    });

    it('omits context from user message when context is empty string', async () => {
      mockFetchSuccess('Clean narrative');
      const client = new OllamaClient(baseConfig);

      await client.generateNarrative('Set the scene.', '');

      const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(opts.body as string);
      // Should not throw or add weird artifacts
      expect(body.messages.length).toBeGreaterThanOrEqual(2);
    });

    it('uses the configured model name in request body', async () => {
      mockFetchSuccess('Narrative');
      const client = new OllamaClient({ ...baseConfig, model: 'custom-model:latest' });
      await client.generateNarrative('Test', '');

      const [, opts] = mockFetch.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(opts.body as string);
      expect(body.model).toBe('custom-model:latest');
    });

    it('throws on HTTP error with status code in message', async () => {
      mockFetchHttpError(500, 'Internal Server Error');
      const client = new OllamaClient(baseConfig);
      await expect(client.generateNarrative('Test', '')).rejects.toThrow('500');
    });

    it('throws on network error', async () => {
      mockFetchNetworkError();
      const client = new OllamaClient(baseConfig);
      await expect(client.generateNarrative('Test', '')).rejects.toThrow();
    });

    it('throws with timeout error on AbortError', async () => {
      mockFetchTimeout();
      const client = new OllamaClient({ ...baseConfig, timeoutMs: 50 });
      await expect(client.generateNarrative('Test', '')).rejects.toThrow(/timeout/i);
    });

    it('throws if response has no choices array', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'test', model: 'x' }), // missing choices
      });
      const client = new OllamaClient(baseConfig);
      await expect(client.generateNarrative('Test', '')).rejects.toThrow(/schema/i);
    });

    it('throws if choices[0].message.content is not a string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: 'test',
          choices: [{ index: 0, message: { role: 'assistant', content: 42 }, finish_reason: 'stop' }],
        }),
      });
      const client = new OllamaClient(baseConfig);
      await expect(client.generateNarrative('Test', '')).rejects.toThrow(/schema/i);
    });
  });
});
