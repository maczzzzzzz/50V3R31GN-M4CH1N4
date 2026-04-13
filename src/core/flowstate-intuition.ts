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
 *
 * Cache layout: data/flowstate-cache.mem
 *   - Magic:     16 bytes ("FLOWSTATE-CACHE\0")
 *   - District:  64 bytes (null-padded UTF-8 string)
 *   - Updated:   8 bytes (u64 LE ms timestamp)
 *   - Count:     4 bytes (u32 LE number of cached triplets)
 *   - Payload:   remaining bytes (JSON-encoded triplet array, null-terminated)
 *
 * The Mmap "slots 5000-6000" are virtualised here as this compact binary
 * structure — the 1000-entry triplet window pre-loaded per district.
 */

import fs from 'node:fs';
import path from 'node:path';
import dgram from 'node:dgram';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

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
    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  }

  /** Start monitoring for district changes. */
  start(): void {
    // Poll shared memory for district_id annotations
    this.pollTimer = setInterval(() => this.pollDistrict(), POLL_INTERVAL);

    // Also listen on VSB UDP for district_focus packets
    this.bindVsb();

    // Immediate first poll
    this.pollDistrict().catch(() => { /* non-fatal */ });
  }

  stop(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.vsbSocket) this.vsbSocket.close();
  }

  /** Return current cached district name (or null). */
  getCachedDistrict(): string | null {
    return this.currentDistrict;
  }

  /** Read the current cache payload (parsed triplets or []). */
  readCache(): RkgTriplet[] {
    try {
      const buf = fs.readFileSync(CACHE_PATH);
      if (buf.length < PAYLOAD_OFFSET) return [];
      if (!buf.subarray(MAGIC_OFFSET, 16).equals(MAGIC)) return [];
      const count = buf.readUInt32LE(COUNT_OFFSET);
      if (count === 0) return [];
      const payload = buf.subarray(PAYLOAD_OFFSET).toString('utf8').replace(/\0+$/, '');
      return JSON.parse(payload) as RkgTriplet[];
    } catch {
      return [];
    }
  }

  /** Force a cache warm for a specific district (useful for testing). */
  async warmDistrict(district: string): Promise<number> {
    return this.warmCache(district);
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async pollDistrict(): Promise<void> {
    // Attempt to detect active district from shared memory annotation or
    // the VSB radar blip data (Watson / Heywood etc. embedded in faction data).
    const detected = this.detectDistrictFromMem();
    if (detected && detected !== this.currentDistrict) {
      this.currentDistrict = detected;
      await this.warmCache(detected).catch(() => { /* non-fatal */ });
    }
  }

  private detectDistrictFromMem(): string | null {
    try {
      // Check if black_ice_state.mem has district annotation at known offsets.
      // Phase 47 added district_id to radar blips; we probe for a UTF-8 string
      // at offset 1024 (annotation slot written by the bridge module).
      if (!fs.existsSync(MEM_PATH)) return null;
      const fd = fs.openSync(MEM_PATH, 'r');
      const probe = Buffer.alloc(64);
      fs.readSync(fd, probe, 0, 64, 1024);
      fs.closeSync(fd);
      const str = probe.toString('utf8').replace(/\0+$/, '').trim();
      if (str.length > 0 && str.length <= 60) return str;
    } catch { /* file may not exist or be too small */ }
    return null;
  }

  private bindVsb(): void {
    try {
      this.vsbSocket = dgram.createSocket('udp4');
      this.vsbSocket.bind(0); // ephemeral port — we only send, not receive here
      // Listen for broadcast district_focus packets from the bridge
      const recv = dgram.createSocket('udp4');
      recv.bind(VSB_PORT + 1, '127.0.0.1', () => {
        recv.on('message', (msg) => {
          try {
            const obj = JSON.parse(msg.toString()) as { type?: string; district?: string };
            if (obj.type === 'district_focus' && obj.district && obj.district !== this.currentDistrict) {
              this.currentDistrict = obj.district;
              this.warmCache(obj.district).catch(() => { /* non-fatal */ });
            }
          } catch { /* not a JSON district packet */ }
        });
      });
      recv.on('error', () => { /* ignore bind errors if port in use */ });
    } catch { /* VSB bind failure is non-fatal */ }
  }

  private async warmCache(district: string): Promise<number> {
    // Query oracle for triplets matching this district (max MAX_TRIPLETS)
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
    } catch {
      // Oracle unavailable — write empty cache entry to signal we tried
    }

    this.writeCacheFile(district, triplets);
    return triplets.length;
  }

  private writeCacheFile(district: string, triplets: RkgTriplet[]): void {
    const payload    = Buffer.from(JSON.stringify(triplets), 'utf8');
    const totalSize  = PAYLOAD_OFFSET + payload.length + 1; // +1 for null terminator
    const buf        = Buffer.alloc(totalSize, 0);

    MAGIC.copy(buf, MAGIC_OFFSET);

    // Write district name (64-byte null-padded)
    const districtBuf = Buffer.from(district.slice(0, 60), 'utf8');
    districtBuf.copy(buf, DISTRICT_OFFSET);

    // Write u64 LE timestamp
    const nowMs = BigInt(Date.now());
    buf.writeBigUInt64LE(nowMs, UPDATED_OFFSET);

    // Write count
    buf.writeUInt32LE(triplets.length, COUNT_OFFSET);

    // Write payload
    payload.copy(buf, PAYLOAD_OFFSET);

    try {
      fs.writeFileSync(CACHE_PATH, buf);
    } catch { /* non-fatal */ }
  }
}
