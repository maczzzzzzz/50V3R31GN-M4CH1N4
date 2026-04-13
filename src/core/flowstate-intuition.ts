/**
 * src/core/flowstate-intuition.ts
 *
 * Phase 52.2: FlowState Intuition — QMD (Query-Mmap-District) Pattern
 *
 * Monitors the VSB for "Active District" focus changes by polling the
 * shared memory file (black_ice_state.mem) and watching for district_id
 * signals on the VSB UDP port. When a district change is detected,
 * pre-warms a dedicated flowstate cache file (data/flowstate-cache.mem)
 * with RKG triplets for that district before any explicit query is issued.
 */

import fs from 'node:fs';
import path from 'node:path';
import dgram from 'node:dgram';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import { logger } from '../shared/logger.js';

// ── Constants ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT   = process.env['PROJECT_ROOT'] ?? process.cwd();
const CACHE_PATH     = path.join(PROJECT_ROOT, 'data/flowstate-cache.mem');
const MEM_PATH       = path.join(PROJECT_ROOT, 'black_ice_state.mem');
const VSB_PORT       = 7878;
const POLL_INTERVAL  = 2_000;   // ms — district change detection poll
const MAX_TRIPLETS   = 1_000;   // slots 5000-6000 window size

const MAGIC = Buffer.from('FLOWSTATE-CACHE\0', 'utf8'); // 16 bytes
const MAGIC_OFFSET    = 0;
const DISTRICT_OFFSET = 16;   // 64 bytes
const UPDATED_OFFSET  = 80;   // 8 bytes (u64 LE ms)
const COUNT_OFFSET    = 88;   // 4 bytes (u32 LE)
const PAYLOAD_OFFSET  = 92;

// ── Triplet type ──────────────────────────────────────────────────────────────

interface RkgTriplet {
  subject_id:      string;
  predicate:       string;
  object_literal:  string;
}

// ── FlowStateIntuition ────────────────────────────────────────────────────────

export class FlowStateIntuition {
  private currentDistrict: string | null = null;
  private pollTimer: NodeJS.Timeout | null = null;
  private vsbSocket: dgram.Socket | null = null;
  private readonly oracle: UnifiedOracleClient;

  constructor(oracle: UnifiedOracleClient) {
    this.oracle = oracle;
    try {
      fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    } catch (e) {
      logger.error('FLOWSTATE', 'init', `Failed to create cache directory: ${path.dirname(CACHE_PATH)}`, { error: (e as Error).message });
    }
  }

  /** Start monitoring for district changes. */
  start(): void {
    this.pollTimer = setInterval(() => this.pollDistrict(), POLL_INTERVAL);
    this.bindVsb();
    this.pollDistrict().catch((e) => {
      logger.error('FLOWSTATE', 'start', `Initial poll failed: ${(e as Error).message}`);
    });
  }

  stop(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.vsbSocket) this.vsbSocket.close();
  }

  getCachedDistrict(): string | null {
    return this.currentDistrict;
  }

  readCache(): RkgTriplet[] {
    try {
      if (!fs.existsSync(CACHE_PATH)) return [];
      const buf = fs.readFileSync(CACHE_PATH);
      if (buf.length < PAYLOAD_OFFSET) return [];
      if (!buf.subarray(MAGIC_OFFSET, 16).equals(MAGIC)) return [];
      const count = buf.readUInt32LE(COUNT_OFFSET);
      if (count === 0) return [];
      const payload = buf.subarray(PAYLOAD_OFFSET).toString('utf8').replace(/\0+$/, '');
      return JSON.parse(payload) as RkgTriplet[];
    } catch (e) {
      logger.error('FLOWSTATE', 'readCache', `Failed to read cache: ${CACHE_PATH}`, { error: (e as Error).message });
      return [];
    }
  }

  async warmDistrict(district: string): Promise<number> {
    return this.warmCache(district);
  }

  private async pollDistrict(): Promise<void> {
    try {
      const detected = this.detectDistrictFromMem();
      if (detected && detected !== this.currentDistrict) {
        logger.info('FLOWSTATE', 'poll', `District shift detected: ${detected}`);
        this.currentDistrict = detected;
        await this.warmCache(detected).catch((e) => {
          logger.error('FLOWSTATE', 'warm', `Cache warm failed for ${detected}: ${(e as Error).message}`);
        });
      }
    } catch (e) {
      logger.error('FLOWSTATE', 'poll', `Poll failed: ${(e as Error).message}`);
    }
  }

  private detectDistrictFromMem(): string | null {
    try {
      if (!fs.existsSync(MEM_PATH)) return null;
      const fd = fs.openSync(MEM_PATH, 'r');
      const probe = Buffer.alloc(64);
      fs.readSync(fd, probe, 0, 64, 1024);
      fs.closeSync(fd);
      const str = probe.toString('utf8').replace(/\0+$/, '').trim();
      if (str.length > 0 && str.length <= 60) return str;
    } catch { /* non-fatal */ }
    return null;
  }

  private bindVsb(): void {
    try {
      this.vsbSocket = dgram.createSocket('udp4');
      const recv = dgram.createSocket('udp4');
      recv.bind(VSB_PORT + 1, '127.0.0.1', () => {
        logger.info('FLOWSTATE', 'bind', `Listening for VSB district packets on 127.0.0.1:${VSB_PORT + 1}`);
        recv.on('message', (msg) => {
          try {
            const obj = JSON.parse(msg.toString()) as { type?: string; district?: string };
            if (obj.type === 'district_focus' && obj.district && obj.district !== this.currentDistrict) {
              logger.info('FLOWSTATE', 'vsb', `District shift via UDP: ${obj.district}`);
              this.currentDistrict = obj.district;
              this.warmCache(obj.district).catch((e) => {
                logger.error('FLOWSTATE', 'warm', `Cache warm failed for ${obj.district}: ${(e as Error).message}`);
              });
            }
          } catch { /* skip */ }
        });
      });
      recv.on('error', (e) => {
        logger.warn('FLOWSTATE', 'bind', `VSB bind error: ${e.message}`);
      });
    } catch (e) {
      logger.error('FLOWSTATE', 'bind', `Failed to initialize VSB socket: ${(e as Error).message}`);
    }
  }

  private async warmCache(district: string): Promise<number> {
    let triplets: RkgTriplet[] = [];
    try {
      const result = await this.oracle.ragSearch({
        query: district,
        topK: MAX_TRIPLETS,
        namespace: 'core_rules',
        similarityThreshold: 0.0,
      });
      triplets = result.matches.map(m => ({
        subject_id:     m.sourceRef.replace('triplet:', ''),
        predicate:      m.sectionHeading ?? 'RELATED',
        object_literal: m.content,
      }));
      logger.info('FLOWSTATE', 'warm', `Cached ${triplets.length} triplets for ${district}`);
    } catch (e) {
      logger.error('FLOWSTATE', 'warm', `Oracle search failed for ${district}: ${(e as Error).message}`);
    }

    try {
      this.writeCacheFile(district, triplets);
    } catch (e) {
      logger.error('FLOWSTATE', 'write', `Failed to write cache file: ${(e as Error).message}`);
    }
    return triplets.length;
  }

  private writeCacheFile(district: string, triplets: RkgTriplet[]): void {
    const payload    = Buffer.from(JSON.stringify(triplets), 'utf8');
    const totalSize  = PAYLOAD_OFFSET + payload.length + 1;
    const buf        = Buffer.alloc(totalSize, 0);

    MAGIC.copy(buf, MAGIC_OFFSET);
    const districtBuf = Buffer.from(district.slice(0, 60), 'utf8');
    districtBuf.copy(buf, DISTRICT_OFFSET);
    buf.writeBigUInt64LE(BigInt(Date.now()), UPDATED_OFFSET);
    buf.writeUInt32LE(triplets.length, COUNT_OFFSET);
    payload.copy(buf, PAYLOAD_OFFSET);

    fs.writeFileSync(CACHE_PATH, buf);
  }
}
