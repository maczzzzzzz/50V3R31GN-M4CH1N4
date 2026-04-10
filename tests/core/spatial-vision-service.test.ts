/**
 * tests/core/spatial-vision-service.test.ts
 *
 * Unit tests for SpatialVisionService (Migrated to llama-server).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SpatialVisionService, type VisualTacticalContext } from '../../src/core/spatial-vision-service.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFetchMock(responseBody: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: () => Promise.resolve(responseBody),
    text: () => Promise.resolve(JSON.stringify(responseBody)),
  });
}

function wrapChatResponse(content: string): object {
  return {
    choices: [
      {
        message: { content },
      },
    ],
  };
}

// ── analyzeWithLlava ─────────────────────────────────────────────────────────

describe('SpatialVisionService.analyzeWithLlava', () => {
  const service = new SpatialVisionService({
    chromeCdpUrl: 'http://localhost:9222',
    sovereignNarrativeBaseUrl: 'http://localhost:8080/v1',
    visionModel: 'llava-v1.5-7b',
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a well-formed JSON response from llama-server', async () => {
    const expected: VisualTacticalContext = {
      tokenClusters: ['3 hostiles near the north door', 'PC at center table'],
      environmentalFeatures: ['concrete wall (north)', 'low cover (crates, east)'],
      rawDescription: 'Urban industrial interior with clear sightlines east-west.',
    };

    vi.stubGlobal(
      'fetch',
      makeFetchMock(wrapChatResponse(JSON.stringify(expected))),
    );

    const result = await service.analyzeWithLlava('base64data==');
    expect(result).toEqual(expected);
  });

  it('wraps a non-JSON response in rawDescription', async () => {
    const freeText = 'I see a map with some tokens.';
    vi.stubGlobal('fetch', makeFetchMock(wrapChatResponse(freeText)));

    const result = await service.analyzeWithLlava('base64data==');
    expect(result.rawDescription).toBe(freeText);
    expect(result.tokenClusters).toEqual([]);
    expect(result.environmentalFeatures).toEqual([]);
  });

  it('returns a graceful fallback when llama-server returns a non-2xx status', async () => {
    vi.stubGlobal('fetch', makeFetchMock({}, 503));

    const result = await service.analyzeWithLlava('base64data==');
    expect(result.tokenClusters).toEqual([]);
    expect(result.environmentalFeatures).toEqual([]);
    expect(result.rawDescription).toBe('VLM Analysis Unavailable');
  });

  it('posts to the correct OpenAI-compatible endpoint', async () => {
    const mockFetch = makeFetchMock(wrapChatResponse('{}'));
    vi.stubGlobal('fetch', mockFetch);

    await service.analyzeWithLlava('abc123==').catch(() => {});

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/v1/chat/completions');
    
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe('llava-v1.5-7b');
    expect(body.messages[0].content[1].image_url.url).toContain('abc123==');
  });
});

// ── Default config values ─────────────────────────────────────────────────────

describe('SpatialVisionService config defaults', () => {
  it('falls back to http://localhost:8080/v1 and llava-v1.5-7b when not specified', async () => {
    delete process.env.VLM_MODEL;
    const service = new SpatialVisionService({ chromeCdpUrl: 'http://localhost:9222' });

    const mockFetch = makeFetchMock(wrapChatResponse('{}'));
    vi.stubGlobal('fetch', mockFetch);

    await service.analyzeWithLlava('data==').catch(() => {});

    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:8080/v1/chat/completions');
    expect(JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1].body as string).model).toBe('llava-v1.5-7b');

    vi.unstubAllGlobals();
  });
});
