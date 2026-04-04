/**
 * src/core/asset-index-service.ts
 *
 * AssetIndexService — Phase 13 Custom Map Ingestion Engine (Infinite Night)
 *
 * Watches a directory for new map files using chokidar, persists metadata to
 * the map_assets table in Akashik.db, and optionally dispatches a detect_walls
 * RPC to Node A via ClawLink for computer-vision wall extraction.
 */

import chokidar, { FSWatcher } from 'chokidar';
import path from 'node:path';
import crypto from 'node:crypto';
import fs from 'node:fs';
import type { IClawLinkClient } from '../api/clawlink-client.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface AssetIndexConfig {
  /** Absolute path to the unprocessed maps directory. */
  watchPath: string;
  /** Optional ClawLink client for dispatching detect_walls RPC to Node A. */
  clawlink?: IClawLinkClient;
  /** Oracle for persisting map_assets to Akashik.db. */
  oracle: UnifiedOracleClient;
}

export class AssetIndexService {
  private readonly config: AssetIndexConfig;
  private watcher: FSWatcher | null = null;

  constructor(config: AssetIndexConfig) {
    this.config = config;
  }

  /** Start watching watchPath. Returns a promise that resolves once ready. */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.watcher = chokidar.watch(this.config.watchPath, {
        ignoreInitial: true,
        persistent: true,
      });

      this.watcher
        .on('add', (filePath) => this.handleNewFile(filePath).catch(console.error))
        .on('ready', () => resolve())
        .on('error', (err) => reject(err));
    });
  }

  /** Stop watching and close the watcher. */
  async stop(): Promise<void> {
    if (this.watcher !== null) {
      await this.watcher.close();
      this.watcher = null;
    }
  }

  /** @internal Exposed for testing. Handles a new file event. */
  async handleNewFile(filePath: string): Promise<void> {
    // Step 1: Compute id as sha256(filePath), hex, first 16 chars
    const id = crypto.createHash('sha256').update(filePath).digest('hex').slice(0, 16);

    // Step 2: Extract fileName
    const fileName = path.basename(filePath);

    // Step 3: Insert row with status = 'processing'
    // INSERT OR REPLACE handles re-add of a previously deleted file at the same path
    this.config.oracle.execute(
      'INSERT OR REPLACE INTO map_assets (id, file_name, file_path, biome, status) VALUES (?, ?, ?, ?, ?)',
      [id, fileName, filePath, null, 'processing'],
    );

    // Step 4: Dispatch detect_walls RPC if clawlink is available and healthy
    const { clawlink, oracle } = this.config;

    if (clawlink) {
      const healthy = await clawlink.isHealthy();
      if (healthy) {
        // Narrow try block to only the RPC call — prevents DB errors from being
        // misattributed as RPC failures.
        let result: { walls: unknown[] };
        try {
          result = await clawlink.executeRpc<{ walls: unknown[] }>('detect_walls', {
            file_path: filePath,
          });
        } catch (err) {
          console.error('[AssetIndexService] detect_walls RPC failed:', err);
          try {
            oracle.execute(
              'UPDATE map_assets SET status=? WHERE id=?',
              ['failed', id],
            );
          } catch (dbErr) {
            console.error('[AssetIndexService] Failed to mark asset as failed:', dbErr);
          }
          return;
        }

        // Success path — outside the try block so DB errors are not misattributed
        try {
          oracle.execute(
            'UPDATE map_assets SET status=?, wall_data=? WHERE id=?',
            ['indexed', JSON.stringify(result.walls), id],
          );
        } catch (dbErr) {
          console.error('[AssetIndexService] Failed to update indexed wall_data:', dbErr);
        }
        return;
      }
      // clawlink present but not healthy — fall through to no-clawlink path
    }

    // Step 5: No clawlink (or unhealthy): set indexed with null wall_data
    try {
      oracle.execute(
        'UPDATE map_assets SET status=? WHERE id=?',
        ['indexed', id],
      );
    } catch (dbErr) {
      console.error('[AssetIndexService] Failed to update asset status to indexed:', dbErr);
    }
  }
}
