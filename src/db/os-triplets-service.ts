import { randomUUID } from 'node:crypto';
import type { SynapseStore, OsTriplet, VecSearchResult } from './synapse-store.js';
import type { IEmbeddingService, ILogger } from './interfaces.js';

export interface TripletWithDistance extends OsTriplet {
  distance: number;
}

export interface UpsertTripletResult {
  id: string;
  vectorized: boolean;
}

/**
 * OsTripletService — bridge between the SQLite text layer and the sqlite-vec
 * float layer for os_triplets.
 *
 * Responsibilities:
 *  - upsert: write text to os_triplets, embed + write to vec_os_triplets
 *  - semanticSearch: embed query → vec_os_triplets kNN → hydrate os_triplets
 *  - exactSearch: standard SQL filter on subject/predicate/object
 */
export class OsTripletService {
  private readonly store: SynapseStore;
  private readonly embedder: IEmbeddingService;
  private readonly logger?: ILogger | undefined;

  constructor(store: SynapseStore, embedder: IEmbeddingService, logger?: ILogger) {
    this.store = store;
    this.embedder = embedder;
    this.logger = logger;
  }

  /**
   * Upsert a (subject, predicate, object) triplet.
   *
   * 1. Writes the text row to os_triplets (UNIQUE constraint handles updates).
   * 2. Embeds the natural-language representation and stores the float vector.
   *
   * Returns { id, vectorized } — vectorized=false when llama-server is offline
   * (graceful degradation; text row is still persisted).
   */
  async upsert(
    subject: string,
    predicate: string,
    object: string,
    roomId?: string,
    clusterId?: string,
  ): Promise<UpsertTripletResult> {
    const traceId = randomUUID();

    const id = this.store.upsertTripletText(subject, predicate, object, roomId, clusterId);

    const text = `${subject} ${predicate} ${object}`;
    let vectorized = false;

    try {
      const embedding = await this.embedder.embed(text);
      this.store.upsertTripletVector(id, embedding);
      vectorized = true;
      this.logger?.debug('OsTripletService', traceId, `Triplet vectorized: ${text}`, { id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger?.warn(
        'OsTripletService',
        traceId,
        `Embedding unavailable — triplet stored as text only: ${msg}`,
        { id, text },
      );
    }

    return { id, vectorized };
  }

  /**
   * Batch-upsert multiple triplets. Embeds all texts in one batch call to
   * minimize round-trips to llama-server.
   */
  async upsertBatch(
    triplets: Array<{ subject: string; predicate: string; object: string; roomId?: string; clusterId?: string }>,
  ): Promise<UpsertTripletResult[]> {
    const traceId = randomUUID();

    const ids = triplets.map(({ subject, predicate, object, roomId, clusterId }) =>
      this.store.upsertTripletText(subject, predicate, object, roomId, clusterId),
    );

    try {
      const texts = triplets.map(({ subject, predicate, object }) =>
        `${subject} ${predicate} ${object}`,
      );
      const embeddings = await this.embedder.embedBatch(texts);
      for (let i = 0; i < ids.length; i++) {
        this.store.upsertTripletVector(ids[i]!, embeddings[i]!);
      }
      this.logger?.info('OsTripletService', traceId, `Batch upsert: ${ids.length} triplets vectorized`);
      return ids.map(id => ({ id, vectorized: true }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger?.warn(
        'OsTripletService',
        traceId,
        `Batch embedding failed — text-only: ${msg}`,
        { count: ids.length },
      );
      return ids.map(id => ({ id, vectorized: false }));
    }
  }

  /**
   * Semantic search: embed the query text, find the k nearest triplets by
   * cosine distance, hydrate the full text rows from os_triplets.
   * 
   * If roomId is provided, results are filtered to that room (Spatial Scoping).
   */
  async semanticSearch(
    query: string,
    topK = 5,
    roomId?: string,
  ): Promise<TripletWithDistance[]> {
    const traceId = randomUUID();

    let vecResults: VecSearchResult[];
    try {
      const embedding = await this.embedder.embed(query);
      vecResults = this.store.vecSearch(embedding, topK);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger?.warn(
        'OsTripletService',
        traceId,
        `Semantic search embedding failed — returning empty: ${msg}`,
        { query },
      );
      return [];
    }

    const results: TripletWithDistance[] = [];
    for (const { triplet_id, distance } of vecResults) {
      const triplet = this.store.getTripletById(triplet_id);
      if (triplet) {
        if (roomId && triplet.room_id !== roomId) continue;
        
        // Consensus Hardgate: Ignore triplets with explicitly negative reputation
        if ((triplet.reputation_score || 0) < 0) continue;

        // Phase 88: Socially-Weighted Retrieval (SWR)
        // Adjust the distance: lower is better for cosine distance.
        // We calculate a similarity score from distance, apply the SWR heuristic, then convert back to an adjusted distance.
        const baseSimilarity = Math.max(0, 1 - (distance / 2)); // cosine distance to similarity
        const validations = triplet.peer_validations || 0;
        const swrMultiplier = 1 + Math.log10(1 + validations);
        const swrScore = baseSimilarity * swrMultiplier;
        
        // We store the swrScore as the "distance" but we want highest scores first, so we'll sort them.
        // Actually, we should just assign the adjusted score and sort descending.
        results.push({ ...triplet, distance: -swrScore }); // Negate so lower is "better" for standard sorting, or we can just sort manually.
      }
    }

    // Sort by SWR Score (which we stored as negative distance, so lowest distance = highest score)
    results.sort((a, b) => a.distance - b.distance);

    this.logger?.debug(
      'OsTripletService',
      traceId,
      `Semantic search "${query}" [Room: ${roomId ?? 'Global'}] → ${results.length} results`,
      { topK },
    );

    return results;
  }

  /**
   * Exact-match search on structured fields (all optional, ANDed together).
   */
  exactSearch(params: {
    subject?: string;
    predicate?: string;
    object?: string;
    roomId?: string;
    clusterId?: string;
  }): OsTriplet[] {
    const db = this.store.getRawDb();
    const clauses: string[] = [];
    const args: string[] = [];

    if (params.subject) {
      clauses.push('subject_id = ?');
      args.push(params.subject);
    }
    if (params.predicate) {
      clauses.push('predicate = ?');
      args.push(params.predicate);
    }
    if (params.object) {
      clauses.push('object_literal = ?');
      args.push(params.object);
    }
    if (params.roomId) {
      clauses.push('room_id = ?');
      args.push(params.roomId);
    }
    if (params.clusterId) {
      clauses.push('cluster_id = ?');
      args.push(params.clusterId);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    return db
      .prepare(`SELECT * FROM os_triplets ${where} ORDER BY last_updated DESC LIMIT 100`)
      .all(...args) as OsTriplet[];
  }
}
