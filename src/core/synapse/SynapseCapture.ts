import { randomUUID } from 'node:crypto';
import type { SynapseStore } from '../../db/synapse-store.js';
import type { OsTripletService } from '../../db/os-triplets-service.js';
import type { ILogger } from '../../db/interfaces.js';

/** Source labels for capture provenance. */
export type CaptureSource =
  | 'VOICE_TRANSCRIPT'
  | 'SESSION_LOG'
  | 'MANUAL'
  | 'AGENT_OBSERVATION'
  | 'MCP_EVENT';

export interface CaptureInput {
  source: CaptureSource;
  content: string;
  metadata?: Record<string, unknown>;
  roomId?: string;
  clusterId?: string;
}

export interface CaptureResult {
  captureId: string;
  extractedTriplets: number;
}

/**
 * SynapseCapture — JARVIS Inbox → Captures pipeline.
 *
 * Flow:
 *   1. Raw input arrives (voice transcript, session log, agent observation).
 *   2. Stored verbatim in synapse_captures (the Inbox).
 *   3. Simple heuristic extraction produces (subject, predicate, object) triplets.
 *   4. Triplets are upserted into os_triplets + vec_os_triplets via OsTripletService.
 *
 * The extraction heuristic uses keyword patterns. A future phase can replace
 * this with an LLM extraction pass once Node D is online.
 */
export class SynapseCapture {
  private readonly store: SynapseStore;
  private readonly tripletService: OsTripletService;
  private readonly logger: ILogger | undefined;

  constructor(store: SynapseStore, tripletService: OsTripletService, logger?: ILogger) {
    this.store = store;
    this.tripletService = tripletService;
    this.logger = logger;
  }

  /**
   * Ingest a raw capture: store in inbox, extract triplets, vectorize.
   */
  async capture(input: CaptureInput): Promise<CaptureResult> {
    const traceId = randomUUID();

    const captureId = this.store.insertCapture(
      input.source,
      input.content,
      input.metadata ?? {},
    );

    this.logger?.info('SynapseCapture', traceId, `Captured from ${input.source}`, {
      captureId,
      contentLength: input.content.length,
    });

    const rawTriplets = this.extractTriplets(input.content, input.source);

    if (rawTriplets.length > 0) {
      const enrichedTriplets = rawTriplets.map(t => ({
        ...t,
        roomId: input.roomId ?? undefined,
        clusterId: input.clusterId ?? undefined,
      }));
      await this.tripletService.upsertBatch(enrichedTriplets);
      this.logger?.info(
        'SynapseCapture',
        traceId,
        `Extracted ${rawTriplets.length} triplets from capture`,
        { captureId },
      );
    }

    return { captureId, extractedTriplets: rawTriplets.length };
  }

  /**
   * Heuristic triplet extraction from freeform text.
   *
   * Patterns recognized (extensible):
   *   "[X] is [Y]"         → (X, is, Y)
   *   "[X] uses [Y]"       → (X, uses, Y)
   *   "[X] runs on [Y]"    → (X, runs_on, Y)
   *   "[X] is_using [Y]"   → (X, is_using, Y)
   *   "[X] connects to [Y]"→ (X, connects_to, Y)
   *   "[X]: [Y]"           → (source, context, "X: Y")
   */
  private extractTriplets(
    content: string,
    source: CaptureSource,
  ): Array<{ subject: string; predicate: string; object: string }> {
    const triplets: Array<{ subject: string; predicate: string; object: string }> = [];

    const patterns: Array<{ re: RegExp; predicate: string }> = [
      { re: /\b(\w[\w\s]{1,40}?)\s+is\s+([\w][\w\s]{1,60})/gi, predicate: 'is' },
      { re: /\b(\w[\w\s]{1,40}?)\s+uses\s+([\w][\w\s]{1,60})/gi, predicate: 'uses' },
      { re: /\b(\w[\w\s]{1,40}?)\s+runs on\s+([\w][\w\s]{1,60})/gi, predicate: 'runs_on' },
      { re: /\b(\w[\w\s]{1,40}?)\s+connects to\s+([\w][\w\s]{1,60})/gi, predicate: 'connects_to' },
      { re: /\b(\w[\w\s]{1,40}?)\s+is_using\s+([\w][\w\s]{1,60})/gi, predicate: 'is_using' },
      { re: /\b(\w[\w\s]{1,40}?)\s+deployed on\s+([\w][\w\s]{1,60})/gi, predicate: 'deployed_on' },
      { re: /\b(\w[\w\s]{1,40}?)\s+depends on\s+([\w][\w\s]{1,60})/gi, predicate: 'depends_on' },
    ];

    for (const { re, predicate } of patterns) {
      let match: RegExpExecArray | null;
      re.lastIndex = 0;
      while ((match = re.exec(content)) !== null) {
        const subject = match[1]!.trim().replace(/\s+/g, '_');
        const object  = match[2]!.trim().replace(/\s+/g, '_');
        if (subject.length > 1 && object.length > 1) {
          triplets.push({ subject, predicate, object });
        }
        if (triplets.length >= 20) break;
      }
      if (triplets.length >= 20) break;
    }

    // Fallback: store the whole capture as a single provenance triplet
    if (triplets.length === 0) {
      const slug = content.slice(0, 80).replace(/\s+/g, '_').replace(/[^\w_]/g, '');
      if (slug.length > 3) {
        triplets.push({ subject: source, predicate: 'captured', object: slug });
      }
    }

    return triplets;
  }
}
