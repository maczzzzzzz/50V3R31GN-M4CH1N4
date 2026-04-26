import CDP from 'chrome-remote-interface';
import { JSDOM } from 'jsdom';
import { randomUUID } from 'node:crypto';
import { logger } from './logger.js';

/**
 * Three-Tier Ingress Model (Phase 81)
 */
export enum IngressTier {
  /** Tier 1: Comms (Read-Only). Restricted browser profile for WhatsApp/Discord. */
  COMMS = 1,
  /** Tier 2: Media (Sandboxed Search). YouTube synthesis, no persistent state. */
  MEDIA = 2,
  /** Tier 3: Research (Distilled Markdown). General web, stripped of JS/CSS. */
  RESEARCH = 3,
}

export interface ScrapeResult {
  url: string;
  tier: IngressTier;
  title: string;
  content: string; // Markdown or raw text depending on tier
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface WebScraperConfig {
  /** Obscura/CDP host. Default: 127.0.0.1 */
  host?: string;
  /** Obscura/CDP port. Default: 9222 */
  port?: number;
}

/**
 * WebScraperSidecar — Phase 81: Host-Bridge Artery
 * 
 * Node B service for Tiered Web Ingress and Content Distillation.
 * Communicates with the Obscura sidecar via CDP.
 */
export class WebScraperSidecar {
  private readonly host: string;
  private readonly port: number;

  constructor(config: WebScraperConfig = {}) {
    this.host = config.host ?? '127.0.0.1';
    this.port = config.port ?? 9222;
  }

  /**
   * Scrape a URL using the specified Ingress Tier.
   * Enforces "Capably Safe" constraints (isolation/read-only).
   */
  async scrape(url: string, tier: IngressTier = IngressTier.RESEARCH): Promise<ScrapeResult> {
    const traceId = randomUUID();
    logger.info('WebScraperSidecar', traceId, `Initiating Tier ${tier} scrape: ${url}`);

    let browserContextId: string | undefined;
    let targetId: string | undefined;
    let client: CDP.Client | undefined;

    try {
      // 1. Establish connection to Obscura
      const browser = await CDP({ host: this.host, port: this.port });
      
      // 2. Enforce Tiered Isolation
      // For Tier 2 (Media) and Tier 3 (Research), we use an isolated browser context (incognito).
      // Tier 1 (Comms) uses the default profile (as it needs session persistence for WhatsApp/Discord)
      // but we enforce "Read-Only" via logic.
      if (tier === IngressTier.MEDIA || tier === IngressTier.RESEARCH) {
        const { browserContextId: ctxId } = await (browser as any).Target.createBrowserContext();
        browserContextId = ctxId;
        const { targetId: tId } = await (browser as any).Target.createTarget({
          url: 'about:blank',
          browserContextId,
        });
        targetId = tId;
      } else {
        // Tier 1: Use default context
        const { targetId: tId } = await (browser as any).Target.createTarget({ url: 'about:blank' });
        targetId = tId;
      }

      // 3. Connect to the specific target
      client = await CDP({ target: targetId as unknown as string, host: this.host, port: this.port });
      await Promise.all([
        client.Page.enable(),
        client.Runtime.enable(),
        client.Network.enable(),
      ]);

      // 4. Enforce "Read-Only" for Tier 1
      if (tier === IngressTier.COMMS) {
        // We could block all mutation requests (POST/PUT/PATCH/DELETE) at the network level
        await client.Network.setRequestInterception({
          patterns: [{ urlPattern: '*', interceptionStage: 'Request' }]
        });
        client.Network.requestIntercepted(async ({ interceptionId, request }: { interceptionId: string, request: any }) => {
          const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
          if (isMutation) {
            logger.warn('WebScraperSidecar', traceId, `Blocked mutation request in Tier 1: ${request.method} ${request.url}`);
            await client!.Network.continueInterceptedRequest({
              interceptionId,
              errorReason: 'Aborted'
            });
          } else {
            await client!.Network.continueInterceptedRequest({ interceptionId });
          }
        });
      }

      // 5. Navigate to URL
      await client.Page.navigate({ url });
      await client.Page.loadEventFired();

      // Wait a bit for JS-heavy sites (Tier 2/3)
      if (tier !== IngressTier.RESEARCH) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 6. Content Distillation
      const { result: titleResult } = await client.Runtime.evaluate({ expression: 'document.title' });
      const title = titleResult.value ?? 'Untitled';

      const { result: htmlResult } = await client.Runtime.evaluate({
        expression: 'document.documentElement.outerHTML'
      });
      const rawHtml = htmlResult.value ?? '';

      let content = '';
      if (tier === IngressTier.RESEARCH) {
        content = this.distillMarkdown(rawHtml);
      } else {
        // For Media/Comms, just get visible text for now
        const { result: textResult } = await client.Runtime.evaluate({
          expression: 'document.body.innerText'
        });
        content = textResult.value ?? '';
      }

      const result: ScrapeResult = {
        url,
        tier,
        title,
        content,
        timestamp: new Date().toISOString(),
      };

      // 7. Cleanup
      await client.close();
      await (browser as any).Target.closeTarget({ targetId: targetId! });
      if (browserContextId) {
        await (browser as any).Target.disposeBrowserContext({ browserContextId });
      }
      await browser.close();

      logger.info('WebScraperSidecar', traceId, `Successfully distilled content from ${url} (Tier ${tier})`);
      return result;

    } catch (err) {
      logger.error('WebScraperSidecar', traceId, `Scrape failed: ${(err as Error).message}`);
      if (client) await client.close();
      throw err;
    }
  }

  /**
   * Distill raw HTML into high-fidelity Markdown for agent ingestion.
   * Strips JS, CSS, and interactive elements.
   */
  private distillMarkdown(html: string): string {
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Remove JS/CSS/Meta/Interactive
    const toRemove = [
      'script', 'style', 'noscript', 'iframe', 'svg', 'canvas', 
      'header', 'footer', 'nav', 'aside', 'form', 'button', 'input'
    ];
    toRemove.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Heuristic content extraction
    // We want to keep headings, paragraphs, lists, and tables.
    const mainContent = doc.body;
    
    // Simple HTML to Markdown converter
    return this.htmlToMarkdown(mainContent);
  }

  /**
   * Recursive HTML to Markdown conversion.
   */
  private htmlToMarkdown(element: Element): string {
    let md = '';

    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 3) { // TEXT_NODE
        md += child.textContent?.trim() ? child.textContent : '';
      } else if (child.nodeType === 1) { // ELEMENT_NODE
        const el = child as Element;
        const tag = el.tagName.toLowerCase();

        switch (tag) {
          case 'h1': md += `\n# ${this.htmlToMarkdown(el)}\n`; break;
          case 'h2': md += `\n## ${this.htmlToMarkdown(el)}\n`; break;
          case 'h3': md += `\n### ${this.htmlToMarkdown(el)}\n`; break;
          case 'p': md += `\n${this.htmlToMarkdown(el)}\n`; break;
          case 'br': md += '\n'; break;
          case 'strong': case 'b': md += `**${this.htmlToMarkdown(el)}**`; break;
          case 'em': case 'i': md += `*${this.htmlToMarkdown(el)}*`; break;
          case 'ul': md += `\n${this.htmlToMarkdown(el)}\n`; break;
          case 'ol': md += `\n${this.htmlToMarkdown(el)}\n`; break;
          case 'li': md += `- ${this.htmlToMarkdown(el)}\n`; break;
          case 'table': md += `\n\n[Table Distilled]\n${this.htmlToMarkdown(el)}\n\n`; break;
          case 'tr': md += `\n| ${this.htmlToMarkdown(el)}`; break;
          case 'td': case 'th': md += `${this.htmlToMarkdown(el)} | `; break;
          case 'a':
            const href = el.getAttribute('href');
            md += `[${this.htmlToMarkdown(el)}](${href})`;
            break;
          default:
            md += this.htmlToMarkdown(el);
        }
      }
    }

    // Cleanup extra newlines
    return md.replace(/\n{3,}/g, '\n\n').trim();
  }
}
