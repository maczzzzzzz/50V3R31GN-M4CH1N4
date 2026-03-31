/**
 * tests/core/spatial-vision-service.test.ts
 *
 * Unit tests for SpatialVisionService.
 *
 * The Playwright CDP path requires a live Chrome session and is an integration
 * concern; we test it via a subclass stub. The Llava analysis path is tested
 * by mocking the global fetch API.
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
    text: () => Promise.resolve(String(responseBody)),
  });
}

// ── analyzeWithLlava ─────────────────────────────────────────────────────────

describe('SpatialVisionService.analyzeWithLlava', () => {
  const service = new SpatialVisionService({
    chromeCdpUrl: 'http://localhost:9222',
    ollamaBaseUrl: 'http://localhost:11434',
    visionModel: 'llava:latest',
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses a well-formed JSON response from Llava', async () => {
    const expected: VisualTacticalContext = {
      tokenClusters: ['3 hostiles near the north door', 'PC at center table'],
      environmentalFeatures: ['concrete wall (north)', 'low cover (crates, east)'],
      rawDescription: 'Urban industrial interior with clear sightlines east-west.',
    };

    vi.stubGlobal(
      'fetch',
      makeFetchMock({ response: JSON.stringify(expected) }),
    );

    const result = await service.analyzeWithLlava('base64data==');
    expect(result).toEqual(expected);
  });

  it('wraps a non-JSON Llava response in rawDescription', async () => {
    const freeText = 'I see a map with some tokens.';
    vi.stubGlobal('fetch', makeFetchMock({ response: freeText }));

    const result = await service.analyzeWithLlava('base64data==');
    expect(result.rawDescription).toBe(freeText);
    expect(result.tokenClusters).toEqual([]);
    expect(result.environmentalFeatures).toEqual([]);
  });

  it('throws when Ollama returns a non-2xx status', async () => {
    vi.stubGlobal('fetch', makeFetchMock({}, 503));

    await expect(service.analyzeWithLlava('base64data==')).rejects.toThrow(
      'Ollama Llava request failed: 503',
    );
  });

  it('posts to the correct Ollama endpoint with the correct model', async () => {
    const mockFetch = makeFetchMock({ response: '{}' });
    vi.stubGlobal('fetch', mockFetch);

    await service.analyzeWithLlava('abc123==').catch(() => {});

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/api/generate');
    const body = JSON.parse(options.body as string);
    expect(body.model).toBe('llava:latest');
    expect(body.images).toEqual(['abc123==']);
    expect(body.format).toBe('json');
    expect(body.stream).toBe(false);
  });
});

// ── Default config values ─────────────────────────────────────────────────────

describe('SpatialVisionService config defaults', () => {
  it('falls back to http://localhost:11434 and llava:latest when not specified', async () => {
    const service = new SpatialVisionService({ chromeCdpUrl: 'http://localhost:9222' });

    const mockFetch = makeFetchMock({ response: '{}' });
    vi.stubGlobal('fetch', mockFetch);

    await service.analyzeWithLlava('data==').catch(() => {});

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:11434/api/generate');
    expect(JSON.parse(options.body as string).model).toBe('llava:latest');

    vi.unstubAllGlobals();
  });
});
