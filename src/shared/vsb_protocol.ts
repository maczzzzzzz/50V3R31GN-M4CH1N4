/// <reference types="vitest/importMeta" />
/**
 * VSB Protocol: Sovereign Binary Schema (TypeScript Mirror)
 * Phase 22.5: Cross-Node Stabilization
 *
 * Zero-copy DataView accessors mirroring the Rust `#[repr(C)]` structs.
 * All reads/writes use little-endian byte order (x86/ARM native).
 *
 * Wire sizes (must match Rust static assertions):
 *   SovereignHeader : 13 bytes
 *   IntentPacket    : 302 bytes
 *   ResultPacket    : 290 bytes
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const VSB_MAGIC: number   = 0xC0DE;
export const VSB_VERSION: number = 0x01;

export const HEADER_SIZE: number      = 13;
export const INTENT_PACKET_SIZE: number = 302;
export const RESULT_PACKET_SIZE: number = 290;

// ─── Discriminants ────────────────────────────────────────────────────────────

export const enum PacketType {
  Intent    = 0x01,
  Result    = 0x02,
  Heartbeat = 0x03,
  Ack       = 0x04,
}

export const enum IntentType {
  Roll       = 0x01,
  Damage     = 0x02,
  SkillCheck = 0x03,
  Heal       = 0x04,
  Friction   = 0x05,
}

export const enum ResultStatus {
  Ok      = 0x00,
  Error   = 0x01,
  Pending = 0x02,
}

// ─── Decoded View Types ───────────────────────────────────────────────────────

export interface SovereignHeaderView {
  magic:      number;   // u16
  version:    number;   // u8
  packetType: number;   // u8  (PacketType)
  sequenceId: number;   // u32
  payloadLen: number;   // u32
  checksum:   number;   // u8
}

export interface IntentPacketView {
  header:     SovereignHeaderView;
  intentType: number;       // u8  (IntentType)
  sessionId:  Uint8Array;   // [u8; 16]
  actorId:    Uint8Array;   // [u8; 16]
  payload:    Uint8Array;   // [u8; 256]
}

export interface ResultPacketView {
  header:     SovereignHeaderView;
  status:     number;       // u8  (ResultStatus)
  sessionId:  Uint8Array;   // [u8; 16]
  resultCode: number;       // u32
  payload:    Uint8Array;   // [u8; 256]
}

// ─── Header Offsets ───────────────────────────────────────────────────────────
// Mirrors the Rust `#[repr(C)]` field layout byte-for-byte.

const HDR = {
  magic:      0,   // u16  @ [0..2]
  version:    2,   // u8   @ [2]
  packetType: 3,   // u8   @ [3]
  sequenceId: 4,   // u32  @ [4..8]
  payloadLen: 8,   // u32  @ [8..12]
  checksum:   12,  // u8   @ [12]
} as const;

// ─── XOR Checksum ────────────────────────────────────────────────────────────

function computeChecksum(buf: Uint8Array, len: number = 12): number {
  let acc = 0;
  for (let i = 0; i < len; i++) acc ^= buf[i]!;
  return acc;
}

// ─── SovereignHeader ─────────────────────────────────────────────────────────

export class SovereignHeaderCodec {
  static readonly SIZE = HEADER_SIZE;

  /**
   * Encode a header into a pre-allocated 13-byte buffer.
   * Checksum is computed and written automatically.
   */
  static encode(
    buf: Uint8Array,
    offset: number,
    packetType: PacketType,
    sequenceId: number,
    payloadLen: number,
  ): void {
    const view = new DataView(buf.buffer, buf.byteOffset + offset, HEADER_SIZE);
    view.setUint16(HDR.magic,      VSB_MAGIC,   true);
    view.setUint8 (HDR.version,    VSB_VERSION);
    view.setUint8 (HDR.packetType, packetType);
    view.setUint32(HDR.sequenceId, sequenceId,  true);
    view.setUint32(HDR.payloadLen, payloadLen,  true);
    // Compute checksum over first 12 bytes, then write it at byte 12
    const slice = buf.subarray(offset, offset + 12);
    view.setUint8(HDR.checksum, computeChecksum(slice));
  }

  /**
   * Decode a header from a byte buffer. Returns null if magic/version/checksum
   * do not match — treat as a dropped packet.
   */
  static decode(buf: Uint8Array, offset: number = 0): SovereignHeaderView | null {
    if (buf.length - offset < HEADER_SIZE) return null;

    const view = new DataView(buf.buffer, buf.byteOffset + offset, HEADER_SIZE);
    const magic   = view.getUint16(HDR.magic,      true);
    const version = view.getUint8 (HDR.version);

    if (magic !== VSB_MAGIC || version !== VSB_VERSION) return null;

    const packetType = view.getUint8 (HDR.packetType);
    const sequenceId = view.getUint32(HDR.sequenceId, true);
    const payloadLen = view.getUint32(HDR.payloadLen, true);
    const checksum   = view.getUint8 (HDR.checksum);

    const expected = computeChecksum(buf.subarray(offset, offset + 12));
    if (checksum !== expected) return null;

    return { magic, version, packetType, sequenceId, payloadLen, checksum };
  }
}

// ─── IntentPacket ────────────────────────────────────────────────────────────
//
// Byte layout:
//   [0..13]   SovereignHeader
//   [13]      intentType: u8
//   [14..30]  sessionId:  [u8; 16]
//   [30..46]  actorId:    [u8; 16]
//   [46..302] payload:    [u8; 256]

const INTENT_OFF = {
  intentType: 13,
  sessionId:  14,
  actorId:    30,
  payload:    46,
} as const;

export class IntentPacketCodec {
  static readonly SIZE = INTENT_PACKET_SIZE;

  static encode(
    intentType: IntentType,
    sequenceId: number,
    sessionId: Uint8Array,  // must be 16 bytes
    actorId: Uint8Array,    // must be 16 bytes
    payload: Uint8Array,    // must be 256 bytes
  ): Uint8Array {
    const buf = new Uint8Array(INTENT_PACKET_SIZE);

    SovereignHeaderCodec.encode(buf, 0, PacketType.Intent, sequenceId, 256);

    buf[INTENT_OFF.intentType] = intentType;
    buf.set(sessionId.subarray(0, 16), INTENT_OFF.sessionId);
    buf.set(actorId.subarray(0, 16),   INTENT_OFF.actorId);
    buf.set(payload.subarray(0, 256),  INTENT_OFF.payload);

    return buf;
  }

  static decode(buf: Uint8Array, offset: number = 0): IntentPacketView | null {
    if (buf.length - offset < INTENT_PACKET_SIZE) return null;

    const header = SovereignHeaderCodec.decode(buf, offset);
    if (header === null || header.packetType !== PacketType.Intent) return null;

    const base = offset + INTENT_OFF.intentType;
    return {
      header,
      intentType: buf[base]!,
      sessionId:  buf.slice(offset + INTENT_OFF.sessionId, offset + INTENT_OFF.sessionId + 16),
      actorId:    buf.slice(offset + INTENT_OFF.actorId,   offset + INTENT_OFF.actorId   + 16),
      payload:    buf.slice(offset + INTENT_OFF.payload,   offset + INTENT_OFF.payload   + 256),
    };
  }
}

// ─── ResultPacket ────────────────────────────────────────────────────────────
//
// Byte layout:
//   [0..13]   SovereignHeader
//   [13]      status:     u8
//   [14..30]  sessionId:  [u8; 16]
//   [30..34]  resultCode: u32  (LE)
//   [34..290] payload:    [u8; 256]

const RESULT_OFF = {
  status:     13,
  sessionId:  14,
  resultCode: 30,
  payload:    34,
} as const;

export class ResultPacketCodec {
  static readonly SIZE = RESULT_PACKET_SIZE;

  static encode(
    status: ResultStatus,
    sequenceId: number,
    sessionId: Uint8Array,   // must be 16 bytes
    resultCode: number,
    payload: Uint8Array,     // must be 256 bytes
  ): Uint8Array {
    const buf = new Uint8Array(RESULT_PACKET_SIZE);

    SovereignHeaderCodec.encode(buf, 0, PacketType.Result, sequenceId, 273);

    buf[RESULT_OFF.status] = status;
    buf.set(sessionId.subarray(0, 16), RESULT_OFF.sessionId);

    const view = new DataView(buf.buffer);
    view.setUint32(RESULT_OFF.resultCode, resultCode, true);

    buf.set(payload.subarray(0, 256), RESULT_OFF.payload);

    return buf;
  }

  static decode(buf: Uint8Array, offset: number = 0): ResultPacketView | null {
    if (buf.length - offset < RESULT_PACKET_SIZE) return null;

    const header = SovereignHeaderCodec.decode(buf, offset);
    if (header === null || header.packetType !== PacketType.Result) return null;

    const view = new DataView(buf.buffer, buf.byteOffset + offset);

    return {
      header,
      status:     buf[offset + RESULT_OFF.status]!,
      sessionId:  buf.slice(offset + RESULT_OFF.sessionId, offset + RESULT_OFF.sessionId + 16),
      resultCode: view.getUint32(RESULT_OFF.resultCode, true),
      payload:    buf.slice(offset + RESULT_OFF.payload, offset + RESULT_OFF.payload + 256),
    };
  }
}

// ─── Ghost Object Protocol ────────────────────────────────────────────────────

/** A hidden tactical marker extracted from scene pixel data via ST3GG. */
export interface GhostBlip {
  /** Normalised X coordinate [0.0–1.0] relative to scene width */
  readonly x: number;
  /** Normalised Y coordinate [0.0–1.0] relative to scene height */
  readonly y: number;
  /** Blip type encoded as a 1-byte integer: 0x01=cover, 0x02=hazard, 0x03=objective */
  readonly blipType: number;
  /** Optional label extracted from steganographic payload */
  readonly label?: string;
}

/** Decode a GhostBlip from a 9-byte VSB payload slice. */
export function decodeGhostBlip(buf: DataView, offset: number): GhostBlip {
  const x = buf.getFloat32(offset, true);
  const y = buf.getFloat32(offset + 4, true);
  const blipType = buf.getUint8(offset + 8);
  return { x, y, blipType };
}

// ─── Vitest Tests ─────────────────────────────────────────────────────────────
// Run via: vitest src/shared/vsb_protocol.ts

if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe('SovereignHeaderCodec', () => {
    it('encodes and decodes a valid header (13-byte round-trip)', () => {
      const buf = new Uint8Array(HEADER_SIZE);
      SovereignHeaderCodec.encode(buf, 0, PacketType.Intent, 42, 256);

      expect(buf.length).toBe(13);

      const hdr = SovereignHeaderCodec.decode(buf);
      expect(hdr).not.toBeNull();
      expect(hdr!.magic).toBe(VSB_MAGIC);
      expect(hdr!.version).toBe(VSB_VERSION);
      expect(hdr!.packetType).toBe(PacketType.Intent);
      expect(hdr!.sequenceId).toBe(42);
      expect(hdr!.payloadLen).toBe(256);
    });

    it('rejects a packet with corrupted checksum', () => {
      const buf = new Uint8Array(HEADER_SIZE);
      SovereignHeaderCodec.encode(buf, 0, PacketType.Intent, 1, 0);
      buf[4]! ^= 0xFF; // corrupt sequence_id byte
      expect(SovereignHeaderCodec.decode(buf)).toBeNull();
    });

    it('rejects wrong magic', () => {
      const buf = new Uint8Array(HEADER_SIZE);
      SovereignHeaderCodec.encode(buf, 0, PacketType.Heartbeat, 0, 0);
      buf[0] = 0xDE;
      buf[1] = 0xAD; // wrong magic
      expect(SovereignHeaderCodec.decode(buf)).toBeNull();
    });

    it('writes magic as 0xDE 0xC0 (little-endian 0xC0DE)', () => {
      const buf = new Uint8Array(HEADER_SIZE);
      SovereignHeaderCodec.encode(buf, 0, PacketType.Ack, 0, 0);
      expect(buf[0]).toBe(0xDE);
      expect(buf[1]).toBe(0xC0);
    });

    it('writes packet_type at byte offset 3', () => {
      const buf = new Uint8Array(HEADER_SIZE);
      SovereignHeaderCodec.encode(buf, 0, PacketType.Result, 0, 0);
      expect(buf[3]).toBe(PacketType.Result);
    });
  });

  describe('IntentPacketCodec', () => {
    it('encodes an IntentPacket to exactly 302 bytes', () => {
      const session = new Uint8Array(16).fill(0xAB);
      const actor   = new Uint8Array(16).fill(0xCD);
      const payload = new Uint8Array(256);
      payload[0] = 0x52; // 'R' for ROLL
      payload[1] = 0x01;
      payload[2] = 0x06;

      const buf = IntentPacketCodec.encode(IntentType.Roll, 1, session, actor, payload);
      expect(buf.length).toBe(302);
    });

    it('round-trips all fields without mutation', () => {
      const session = new Uint8Array(16).fill(0xAB);
      const actor   = new Uint8Array(16).fill(0xCD);
      const payload = new Uint8Array(256);
      payload[0] = 0x52;

      const buf  = IntentPacketCodec.encode(IntentType.Roll, 7, session, actor, payload);
      const view = IntentPacketCodec.decode(buf);

      expect(view).not.toBeNull();
      expect(view!.header.sequenceId).toBe(7);
      expect(view!.header.packetType).toBe(PacketType.Intent);
      expect(view!.intentType).toBe(IntentType.Roll);
      expect(Array.from(view!.sessionId)).toEqual(Array.from(session));
      expect(Array.from(view!.actorId)).toEqual(Array.from(actor));
      expect(view!.payload[0]).toBe(0x52);
    });
  });

  describe('ResultPacketCodec', () => {
    it('encodes a ResultPacket to exactly 290 bytes', () => {
      const session = new Uint8Array(16).fill(0x12);
      const payload = new Uint8Array(256);
      payload[0] = 17;

      const buf = ResultPacketCodec.encode(ResultStatus.Ok, 1, session, 17, payload);
      expect(buf.length).toBe(290);
    });

    it('round-trips all fields without mutation', () => {
      const session = new Uint8Array(16).fill(0x12);
      const payload = new Uint8Array(256);
      payload[0] = 17;

      const buf  = ResultPacketCodec.encode(ResultStatus.Ok, 3, session, 17, payload);
      const view = ResultPacketCodec.decode(buf);

      expect(view).not.toBeNull();
      expect(view!.header.sequenceId).toBe(3);
      expect(view!.header.packetType).toBe(PacketType.Result);
      expect(view!.status).toBe(ResultStatus.Ok);
      expect(Array.from(view!.sessionId)).toEqual(Array.from(session));
      expect(view!.resultCode).toBe(17);
      expect(view!.payload[0]).toBe(17);
    });

    it('rejects a ResultPacket with a bad header', () => {
      const session = new Uint8Array(16);
      const payload = new Uint8Array(256);
      const buf = ResultPacketCodec.encode(ResultStatus.Ok, 0, session, 0, payload);
      buf[12]! ^= 0xFF; // corrupt checksum byte
      expect(ResultPacketCodec.decode(buf)).toBeNull();
    });
  });
}
