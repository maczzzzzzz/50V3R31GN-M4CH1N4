import { describe, it, expect, vi, beforeEach } from 'vitest';
import CDP from 'chrome-remote-interface';
import { WebScraperSidecar, IngressTier } from '../../src/shared/WebScraperSidecar.js';

// ── Mock chrome-remote-interface ──────────────────────────────────────────────

const { mockCDP, mockClient, mockBrowser } = vi.hoisted(() => {
  const client = {
    Page: {
      enable: vi.fn().mockResolvedValue(undefined),
      navigate: vi.fn().mockResolvedValue(undefined),
      loadEventFired: vi.fn().mockResolvedValue(undefined),
    },
    Runtime: {
      enable: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockImplementation(({ expression }) => {
        if (expression === 'document.title') return { result: { value: 'Test Title' } };
        if (expression === 'document.documentElement.outerHTML') return { result: { value: '<html><body><h1>Hello</h1><p>World</p></body></html>' } };
        if (expression === 'document.body.innerText') return { result: { value: 'Hello World' } };
        return { result: { value: '' } };
      }),
    },
    Network: {
      enable: vi.fn().mockResolvedValue(undefined),
      setRequestInterception: vi.fn().mockResolvedValue(undefined),
      requestIntercepted: vi.fn().mockResolvedValue(undefined),
      continueInterceptedRequest: vi.fn().mockResolvedValue(undefined),
    },
    close: vi.fn().mockResolvedValue(undefined),
  };

  const browser = {
    Target: {
      createBrowserContext: vi.fn().mockResolvedValue({ browserContextId: 'ctx-123' }),
      createTarget: vi.fn().mockResolvedValue({ targetId: 'target-456' }),
      closeTarget: vi.fn().mockResolvedValue(undefined),
      disposeBrowserContext: vi.fn().mockResolvedValue(undefined),
    },
    close: vi.fn().mockResolvedValue(undefined),
  };

  const cdp = vi.fn().mockImplementation((opts) => {
    if (opts.target) return Promise.resolve(client);
    return Promise.resolve(browser);
  }) as any;

  return { mockCDP: cdp, mockClient: client, mockBrowser: browser };
});

vi.mock('chrome-remote-interface', () => ({ default: mockCDP }));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WebScraperSidecar', () => {
  let scraper: WebScraperSidecar;

  beforeEach(() => {
    vi.clearAllMocks();
    scraper = new WebScraperSidecar();
  });

  it('scrapes a URL in Research Tier (Tier 3) and returns Markdown', async () => {
    const result = await scraper.scrape('https://example.com', IngressTier.RESEARCH);

    expect(result.title).toBe('Test Title');
    expect(result.tier).toBe(IngressTier.RESEARCH);
    expect(result.content).toContain('# Hello');
    expect(result.content).toContain('World');
    
    // Verify isolation
    expect(mockBrowser.Target.createBrowserContext).toHaveBeenCalled();
    expect(mockBrowser.Target.createTarget).toHaveBeenCalledWith(expect.objectContaining({
      browserContextId: 'ctx-123'
    }));
  });

  it('scrapes a URL in Comms Tier (Tier 1) and enforces Read-Only', async () => {
    const result = await scraper.scrape('https://comms.com', IngressTier.COMMS);

    expect(result.tier).toBe(IngressTier.COMMS);
    expect(result.content).toBe('Hello World');

    // Verify Read-Only enforcement
    expect(mockClient.Network.setRequestInterception).toHaveBeenCalledWith({
      patterns: [{ urlPattern: '*', interceptionStage: 'Request' }]
    });
    expect(mockClient.Network.requestIntercepted).toHaveBeenCalled();
    
    // Tier 1 uses default context
    expect(mockBrowser.Target.createBrowserContext).not.toHaveBeenCalled();
  });

  it('scrapes a URL in Media Tier (Tier 2)', async () => {
    const result = await scraper.scrape('https://youtube.com', IngressTier.MEDIA);

    expect(result.tier).toBe(IngressTier.MEDIA);
    expect(result.content).toBe('Hello World');
    
    // Verify isolation
    expect(mockBrowser.Target.createBrowserContext).toHaveBeenCalled();
  });

  it('handles distillation of complex HTML to Markdown', async () => {
    const complexHtml = `
      <html>
        <head><title>Complex</title></head>
        <body>
          <script>console.log("bad");</script>
          <style>.bad { color: red; }</style>
          <nav>Home | About</nav>
          <main>
            <h1>Main Title</h1>
            <p>Some text with <strong>bold</strong> and <em>italic</em>.</p>
            <ul>
              <li>Item 1</li>
              <li>Item 2</li>
            </ul>
            <table>
              <tr><th>Header</th></tr>
              <tr><td>Data</td></tr>
            </table>
            <a href="/link">Link</a>
          </main>
          <footer>Footer</footer>
        </body>
      </html>
    `;

    mockClient.Runtime.evaluate.mockImplementation(({ expression }) => {
      if (expression === 'document.title') return { result: { value: 'Complex' } };
      if (expression === 'document.documentElement.outerHTML') return { result: { value: complexHtml } };
      return { result: { value: '' } };
    });

    const result = await scraper.scrape('https://complex.com', IngressTier.RESEARCH);

    expect(result.content).toContain('# Main Title');
    expect(result.content).toContain('**bold**');
    expect(result.content).toContain('*italic*');
    expect(result.content).toContain('- Item 1');
    expect(result.content).toContain('[Table Distilled]');
    expect(result.content).toContain('| Header');
    expect(result.content).toContain('| Data');
    expect(result.content).toContain('[Link](/link)');

    // Ensure scripts/styles/nav/footer are removed
    expect(result.content).not.toContain('console.log');
    expect(result.content).not.toContain('.bad');
    expect(result.content).not.toContain('Home | About');
    expect(result.content).not.toContain('Footer');
  });
});
