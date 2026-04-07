import fs from 'node:fs';

export interface RadarBlip {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  actorType: 0 | 1;
  faction: string;
}

export interface Capability {
  id: string;
  name: string;
  type: string;
}

const MAGIC = Buffer.from('BLACK-ICE-RADAR\0', 'utf8'); // 16 bytes
const CAPABILITY_MAGIC = Buffer.from('CAPABILITY-LIST\0', 'utf8'); // 16 bytes
const FILE_SIZE = 4_194_304;
const HEADER_SIZE = 24;
const BLIP_SIZE = 64;
const MAX_BLIPS = Math.floor((FILE_SIZE - HEADER_SIZE) / BLIP_SIZE); // 65503

const CAPABILITY_OFFSET = 8192;
const CAPABILITY_HEADER_SIZE = 20;
const CAPABILITY_ITEM_SIZE = 64;

function writeNullPadded(buf: Buffer, offset: number, str: string, maxChars: number): void {
  buf.fill(0, offset, offset + maxChars + 1);
  const truncated = str.slice(0, maxChars);
  buf.write(truncated, offset, 'utf8');
}

export class SharedMemoryService {
  private readonly filePath: string;
  private readonly buf: Buffer;
  private fd: number | null = null;
  private counter: number = 0;

  constructor(memFilePath: string) {
    this.filePath = memFilePath;
    this.buf = Buffer.alloc(FILE_SIZE, 0);
  }

  open(): void {
    const fileExists = fs.existsSync(this.filePath);

    if (fileExists) {
      this.fd = fs.openSync(this.filePath, 'r+');
      fs.chmodSync(this.filePath, 0o600);

      const headerBuf = Buffer.alloc(24);
      fs.readSync(this.fd, headerBuf, 0, 24, 0);

      const magic = headerBuf.subarray(0, 16);
      if (!magic.equals(MAGIC)) {
        fs.closeSync(this.fd);
        this.fd = null;
        throw new Error('SharedMemoryService: invalid magic bytes — file may be corrupted');
      }

      this.counter = headerBuf.readUInt32LE(16);
    } else {
      this.fd = fs.openSync(this.filePath, 'w+', 0o600);
      MAGIC.copy(this.buf, 0);
      this.buf.writeUInt32LE(0, 16);
      this.buf.writeUInt32LE(0, 20);
      fs.writeSync(this.fd, this.buf, 0, FILE_SIZE, 0);
      this.counter = 0;
    }
  }

  writeWorldState(blips: RadarBlip[]): void {
    if (this.fd === null) throw new Error('SharedMemoryService: call open() first');

    this.counter = (this.counter + 1) >>> 0;
    const count = Math.min(blips.length, MAX_BLIPS);

    this.buf.fill(0);
    MAGIC.copy(this.buf, 0);
    this.buf.writeUInt32LE(this.counter, 16);
    this.buf.writeUInt32LE(count, 20);

    for (let i = 0; i < count; i++) {
      const blip = blips[i] as RadarBlip;
      const base = HEADER_SIZE + i * BLIP_SIZE;

      writeNullPadded(this.buf, base + 0, blip.id, 15);
      writeNullPadded(this.buf, base + 16, blip.name, 15);

      const x = (typeof blip.x !== 'number' || isNaN(blip.x)) ? 500.0 : blip.x;
      const y = (typeof blip.y !== 'number' || isNaN(blip.y)) ? 500.0 : blip.y;
      this.buf.writeFloatLE(x, base + 32);
      this.buf.writeFloatLE(y, base + 36);
      this.buf.writeInt32LE(blip.hp, base + 40);
      this.buf.writeUInt8(blip.actorType, base + 44);
      writeNullPadded(this.buf, base + 48, blip.faction, 15);
    }

    fs.writeSync(this.fd, this.buf, 0, FILE_SIZE, 0);
  }

  readWorldState(): RadarBlip[] {
    if (this.fd === null) throw new Error('SharedMemoryService: call open() first');

    fs.readSync(this.fd, this.readHeaderBuf, 0, HEADER_SIZE, 0);
    
    const magic = this.readHeaderBuf.subarray(0, 16);
    if (!magic.equals(MAGIC)) return [];

    const count = this.readHeaderBuf.readUInt32LE(20);
    if (count > MAX_BLIPS) return []; // Protect against huge counts
    const blips: RadarBlip[] = [];

    fs.readSync(this.fd, this.readBodyBuf, 0, count * BLIP_SIZE, HEADER_SIZE);

    for (let i = 0; i < count; i++) {
      const base = i * BLIP_SIZE;
      blips.push({
        id: this.readBodyBuf.toString('utf8', base, base + 16).replace(/\0/g, ''),
        name: this.readBodyBuf.toString('utf8', base + 16, base + 32).replace(/\0/g, ''),
        x: this.readBodyBuf.readFloatLE(base + 32),
        y: this.readBodyBuf.readFloatLE(base + 36),
        hp: this.readBodyBuf.readInt32LE(base + 40),
        actorType: this.readBodyBuf.readUInt8(base + 44) as 0 | 1,
        faction: this.readBodyBuf.toString('utf8', base + 48, base + 64).replace(/\0/g, ''),
      });
    }
    return blips;
  }

  close(): void {
    if (this.fd !== null) {
      fs.closeSync(this.fd);
      this.fd = null;
    }
  }

  // Phase 24: The Flush Gate
  // Proposal layout at offset 1024:
  // ID: UInt32LE (0-3)
  // Origin: UInt8 (4)
  // ActionType: UInt8 (5)
  // Status: UInt8 (6)
  // Reserved: UInt8 (7)
  // Payload: 256 bytes (8-263)
  
  writeProposal(id: number, origin: number, actionType: number, payloadStr: string): void {
    if (this.fd === null) throw new Error('SharedMemoryService: call open() first');
    
    const PROPOSAL_OFFSET = 1024;
    this.buf.writeUInt32LE(id, PROPOSAL_OFFSET);
    this.buf.writeUInt8(origin, PROPOSAL_OFFSET + 4);
    this.buf.writeUInt8(actionType, PROPOSAL_OFFSET + 5);
    this.buf.writeUInt8(0, PROPOSAL_OFFSET + 6); // Status = 0 (Pending)
    this.buf.writeUInt8(0, PROPOSAL_OFFSET + 7); // Reserved
    
    // Clear payload
    this.buf.fill(0, PROPOSAL_OFFSET + 8, PROPOSAL_OFFSET + 264);
    const payloadBuf = Buffer.from(payloadStr.slice(0, 256), 'utf8');
    payloadBuf.copy(this.buf, PROPOSAL_OFFSET + 8);
    
    fs.writeSync(this.fd, this.buf, PROPOSAL_OFFSET, 264, PROPOSAL_OFFSET);
  }

  checkProposalStatus(): { id: number; status: number } {
    if (this.fd === null) throw new Error('SharedMemoryService: call open() first');
    
    const PROPOSAL_OFFSET = 1024;
    const headerBuf = Buffer.alloc(8);
    fs.readSync(this.fd, headerBuf, 0, 8, PROPOSAL_OFFSET);
    
    return {
      id: headerBuf.readUInt32LE(0),
      status: headerBuf.readUInt8(6)
    };
  }

  writeCapabilities(actorId: string, capabilities: Capability[]): void {
    if (this.fd === null) throw new Error('SharedMemoryService: call open() first');

    const count = Math.min(capabilities.length, 128); // Limit to 128 capabilities for now

    // Write Capability Header
    this.buf.fill(0, CAPABILITY_OFFSET, CAPABILITY_OFFSET + CAPABILITY_HEADER_SIZE);
    CAPABILITY_MAGIC.copy(this.buf, CAPABILITY_OFFSET);
    this.buf.writeUInt32LE(count, CAPABILITY_OFFSET + 16);

    for (let i = 0; i < count; i++) {
      const cap = capabilities[i];
      const base = CAPABILITY_OFFSET + CAPABILITY_HEADER_SIZE + i * CAPABILITY_ITEM_SIZE;

      // CapabilityRaw: id (16), name (32), capability_type (16)
      writeNullPadded(this.buf, base + 0, cap.id, 15);
      writeNullPadded(this.buf, base + 16, cap.name, 31);
      writeNullPadded(this.buf, base + 48, cap.type, 15);
    }

    const totalSize = CAPABILITY_HEADER_SIZE + count * CAPABILITY_ITEM_SIZE;
    fs.writeSync(this.fd, this.buf, CAPABILITY_OFFSET, totalSize, CAPABILITY_OFFSET);
  }

  get transactionCounter(): number {
    return this.counter;
  }
}
