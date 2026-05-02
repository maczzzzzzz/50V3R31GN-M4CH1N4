import { randomUUID } from 'node:crypto';
import type { SynapseStore } from '../../db/synapse-store.js';
import type { ILogger } from '../../db/interfaces.js';

/**
 * POSTCARD_INGESTOR — v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
 * 
 * Handles 'POSTCARD_v1' telemetry from mobile devices.
 * Updates reputation scores and logs snapshots for social hall visualization.
 */

export interface PostcardV1 {
  type: 'POSTCARD_v1';
  id: string;
  node_id: string;
  timestamp: string;
  vitals: {
    battery: number;
    network: string;
    thermal: string;
  };
  reputation_delta: number;
  location_mask: string;
}

export class PostcardIngestor {
  private readonly store: SynapseStore;
  private readonly logger: ILogger | undefined;

  constructor(store: SynapseStore, logger?: ILogger) {
    this.store = store;
    this.logger = logger;
  }

  public async ingest(postcard: PostcardV1): Promise<void> {
    const traceId = randomUUID();
    
    try {
      // 1. Persist to mobile_postcards
      this.store.insertPostcard({
        id: postcard.id,
        node_id: postcard.node_id,
        timestamp: postcard.timestamp,
        vitals: JSON.stringify(postcard.vitals),
        reputation_delta: postcard.reputation_delta,
        location_mask: postcard.location_mask,
      });

      // 2. Update agent reputation
      // We map node_id to an agent's triplet or intelligence shard
      // For Phase 91, we assume node_id maps to a specific identity in os_triplets
      this.store.updateReputation(postcard.node_id, postcard.reputation_delta);

      this.logger?.info('PostcardIngestor', traceId, `Ingested POSTCARD-v1 from ${postcard.node_id}`, {
        postcardId: postcard.id,
        delta: postcard.reputation_delta
      });
    } catch (err) {
      this.logger?.error('PostcardIngestor', traceId, `Ingestion failed: ${err}`, { postcard });
    }
  }
}
