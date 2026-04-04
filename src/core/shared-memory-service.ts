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

const MAGIC = Buffer.from('BLACK-ICE-RADAR\0', 'utf8'); // 16 bytes
const FILE_SIZE = 4_194_304;
const HEADER_SIZE = 24;
const BLIP_SIZE = 64;
const MAX_BLIPS = Math.floor((FILE_SIZE - HEADER_SIZE) / BLIP_SIZE); // 65503

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
    this.fd = fs.openSync(this.filePath, fileExists ? 'r+' : 'w+');

    if (fileExists) {
      const headerBuf = Buffer.alloc(24);
      fs.readSync(this.fd, headerBuf, 0, 24, 0);
      this.counter = headerBuf.readUInt32LE(16);
    } else {
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

    const headerBuf = Buffer.alloc(HEADER_SIZE);
    fs.readSync(this.fd, headerBuf, 0, HEADER_SIZE, 0);
    
    const magic = headerBuf.subarray(0, 16);
    if (!magic.equals(MAGIC)) return [];

    const count = headerBuf.readUInt32LE(20);
    const blips: RadarBlip[] = [];

    const fullBuf = Buffer.alloc(count * BLIP_SIZE);
    fs.readSync(this.fd, fullBuf, 0, count * BLIP_SIZE, HEADER_SIZE);

    for (let i = 0; i < count; i++) {
      const base = i * BLIP_SIZE;
      blips.push({
        id: fullBuf.toString('utf8', base, base + 16).replace(/\0/g, ''),
        name: fullBuf.toString('utf8', base + 16, base + 32).replace(/\0/g, ''),
        x: fullBuf.readFloatLE(base + 32),
        y: fullBuf.readFloatLE(base + 36),
        hp: fullBuf.readInt32LE(base + 40),
        actorType: fullBuf.readUInt8(base + 44) as 0 | 1,
        faction: fullBuf.toString('utf8', base + 48, base + 64).replace(/\0/g, ''),
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

  get transactionCounter(): number {
    return this.counter;
  }
}
