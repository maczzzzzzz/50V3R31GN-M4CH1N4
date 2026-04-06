import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SharedMemoryService } from '../../src/core/shared-memory-service.js';

const FILE_SIZE = 4_194_304;
const HEADER_SIZE = 24;
const BLIP_SIZE = 64;

let tmpFile: string;
let svc: SharedMemoryService;

beforeEach(() => {
  tmpFile = path.join(os.tmpdir(), `black_ice_test_${Date.now()}_${Math.random().toString(36).slice(2)}.mem`);
  svc = new SharedMemoryService(tmpFile);
});

afterEach(() => {
  svc.close();
  if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
});

describe('SharedMemoryService', () => {
  it('creates the file with correct magic header', () => {
    svc.open();
    const buf = Buffer.alloc(16);
    const fd = fs.openSync(tmpFile, 'r');
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    expect(buf.toString('utf8', 0, 15)).toBe('BLACK-ICE-RADAR');
    expect(buf[15]).toBe(0);
  });

  it('creates a 4MB file', () => {
    svc.open();
    const stat = fs.statSync(tmpFile);
    expect(stat.size).toBe(FILE_SIZE);
  });

  it('transaction counter starts at 0, increments to 1 after first write, 2 after second', () => {
    svc.open();
    expect(svc.transactionCounter).toBe(0);

    svc.writeWorldState([]);
    expect(svc.transactionCounter).toBe(1);

    svc.writeWorldState([]);
    expect(svc.transactionCounter).toBe(2);
  });

  it('transaction counter is persisted to file and read back on re-open', () => {
    svc.open();
    svc.writeWorldState([]);
    svc.writeWorldState([]);
    svc.close();

    const svc2 = new SharedMemoryService(tmpFile);
    svc2.open();
    expect(svc2.transactionCounter).toBe(2);
    svc2.close();
  });

  it('blip_count field in header matches input array length', () => {
    const blips = [
      { id: 'npc1', name: 'Ghost', x: 100, y: 200, hp: 30, actorType: 0 as const, faction: 'Nomads' },
      { id: 'npc2', name: 'Shard', x: 300, y: 400, hp: 20, actorType: 1 as const, faction: 'Corp' },
    ];
    svc.open();
    svc.writeWorldState(blips);

    const headerBuf = Buffer.alloc(24);
    const fd = fs.openSync(tmpFile, 'r');
    fs.readSync(fd, headerBuf, 0, 24, 0);
    fs.closeSync(fd);

    const blipCount = headerBuf.readUInt32LE(20);
    expect(blipCount).toBe(2);
  });

  it('serializes blip name correctly at the right offset', () => {
    const blips = [
      { id: 'npc1', name: 'Kovacs', x: 100, y: 200, hp: 30, actorType: 0 as const, faction: 'Nomads' },
    ];
    svc.open();
    svc.writeWorldState(blips);

    const nameBuf = Buffer.alloc(16);
    const fd = fs.openSync(tmpFile, 'r');
    fs.readSync(fd, nameBuf, 0, 16, HEADER_SIZE + 16); // base + 16 = name offset
    fs.closeSync(fd);

    expect(nameBuf.toString('utf8', 0, 6)).toBe('Kovacs');
    expect(nameBuf[6]).toBe(0); // null-terminated
  });

  it('serializes blip id correctly at the right offset', () => {
    const blips = [
      { id: 'actor-42', name: 'Z', x: 100, y: 200, hp: 10, actorType: 0 as const, faction: '' },
    ];
    svc.open();
    svc.writeWorldState(blips);

    const idBuf = Buffer.alloc(16);
    const fd = fs.openSync(tmpFile, 'r');
    fs.readSync(fd, idBuf, 0, 16, HEADER_SIZE + 0);
    fs.closeSync(fd);

    expect(idBuf.toString('utf8', 0, 8)).toBe('actor-42');
  });

  it('defaults x and y to 500.0 when NaN is provided', () => {
    const blips = [
      { id: 'n1', name: 'Blip', x: NaN, y: NaN, hp: 10, actorType: 0 as const, faction: 'Test' },
    ];
    svc.open();
    svc.writeWorldState(blips);

    const posBuf = Buffer.alloc(8);
    const fd = fs.openSync(tmpFile, 'r');
    fs.readSync(fd, posBuf, 0, 8, HEADER_SIZE + 32); // x at +32, y at +36
    fs.closeSync(fd);

    const x = posBuf.readFloatLE(0);
    const y = posBuf.readFloatLE(4);
    expect(x).toBeCloseTo(500.0, 1);
    expect(y).toBeCloseTo(500.0, 1);
  });

  it('truncates strings longer than 15 chars and null-terminates at byte 15', () => {
    const longName = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; // 26 chars
    const blips = [
      { id: 'x', name: longName, x: 0, y: 0, hp: 0, actorType: 0 as const, faction: '' },
    ];
    svc.open();
    svc.writeWorldState(blips);

    const nameBuf = Buffer.alloc(16);
    const fd = fs.openSync(tmpFile, 'r');
    fs.readSync(fd, nameBuf, 0, 16, HEADER_SIZE + 16);
    fs.closeSync(fd);

    expect(nameBuf.toString('utf8', 0, 15)).toBe('ABCDEFGHIJKLMNO');
    expect(nameBuf[15]).toBe(0);
  });

  it('transaction counter field in file matches in-memory counter', () => {
    svc.open();
    svc.writeWorldState([]);
    svc.writeWorldState([]);
    svc.writeWorldState([]);

    const headerBuf = Buffer.alloc(24);
    const fd = fs.openSync(tmpFile, 'r');
    fs.readSync(fd, headerBuf, 0, 24, 0);
    fs.closeSync(fd);

    const fileCounter = headerBuf.readUInt32LE(16);
    expect(fileCounter).toBe(3);
    expect(svc.transactionCounter).toBe(3);
  });

  it('each blip occupies exactly 64 bytes (second blip at correct offset)', () => {
    const blips = [
      { id: 'first', name: 'Alpha', x: 100, y: 100, hp: 50, actorType: 0 as const, faction: 'A' },
      { id: 'second', name: 'Beta', x: 200, y: 200, hp: 40, actorType: 1 as const, faction: 'B' },
    ];
    svc.open();
    svc.writeWorldState(blips);

    const idBuf = Buffer.alloc(16);
    const fd = fs.openSync(tmpFile, 'r');
    fs.readSync(fd, idBuf, 0, 16, HEADER_SIZE + BLIP_SIZE + 0);
    fs.closeSync(fd);

    expect(idBuf.toString('utf8', 0, 6)).toBe('second');
  });

  // ── security hardening ──────────────────────────────────────────────────────

  describe('security hardening', () => {
    it('open() on a new file creates it with 0600 permissions', () => {
      svc.open();
      const stat = fs.statSync(tmpFile);
      // stat.mode & 0o777 masks off the file-type bits
      expect(stat.mode & 0o777).toBe(0o600);
    });

    it('open() on an existing file enforces 0600 permissions', () => {
      // Create a file with overly permissive mode first
      fs.writeFileSync(tmpFile, Buffer.alloc(4_194_304, 0), { mode: 0o644 });
      // Write valid magic so the re-open won't throw on bad magic
      const MAGIC = Buffer.from('BLACK-ICE-RADAR\0', 'utf8');
      const fd = fs.openSync(tmpFile, 'r+');
      fs.writeSync(fd, MAGIC, 0, 16, 0);
      fs.closeSync(fd);

      const svc2 = new SharedMemoryService(tmpFile);
      svc2.open();
      svc2.close();

      const stat = fs.statSync(tmpFile);
      expect(stat.mode & 0o777).toBe(0o600);
    });

    it('open() on an existing file with bad magic throws invalid magic bytes error', () => {
      // Create a file with wrong magic bytes
      fs.writeFileSync(tmpFile, Buffer.alloc(4_194_304, 0), { mode: 0o600 });
      const badMagic = Buffer.from('CORRUPTED-DATA\0\0', 'utf8');
      const fd = fs.openSync(tmpFile, 'r+');
      fs.writeSync(fd, badMagic, 0, 16, 0);
      fs.closeSync(fd);

      const svc2 = new SharedMemoryService(tmpFile);
      expect(() => svc2.open()).toThrow('SharedMemoryService: invalid magic bytes — file may be corrupted');
      svc2.close();
    });
  });

  it('writeCapabilities serializes capabilities at offset 8192', () => {
    const caps = [
      { id: 'cap1', name: 'Neural Link', type: 'interface' },
      { id: 'cap2', name: 'Optics', type: 'sensory' },
    ];
    svc.open();
    svc.writeCapabilities('actor1', caps);

    const fd = fs.openSync(tmpFile, 'r');
    
    // Check Header
    const headerBuf = Buffer.alloc(20);
    fs.readSync(fd, headerBuf, 0, 20, 8192);
    expect(headerBuf.toString('utf8', 0, 15)).toBe('CAPABILITY-LIST');
    expect(headerBuf.readUInt32LE(16)).toBe(2);

    // Check First Item
    const itemBuf = Buffer.alloc(64);
    fs.readSync(fd, itemBuf, 0, 64, 8192 + 20);
    expect(itemBuf.toString('utf8', 0, 4)).toBe('cap1');
    expect(itemBuf.toString('utf8', 16, 16 + 11)).toBe('Neural Link');
    expect(itemBuf.toString('utf8', 48, 48 + 9)).toBe('interface');

    fs.closeSync(fd);
  });
});
