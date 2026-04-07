import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SharedMemoryService } from '../../src/core/shared-memory-service.js';
import { spawn } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';
import { rmSync, existsSync } from 'fs';

const TEST_MMAP_PATH = join(tmpdir(), `test-black-ice-${Date.now()}.mem`);

describe('Mmap Concurrency & Integrity Audit', () => {
  let mmapService: SharedMemoryService;

  beforeAll(() => {
    if (existsSync(TEST_MMAP_PATH)) rmSync(TEST_MMAP_PATH);
    mmapService = new SharedMemoryService(TEST_MMAP_PATH);
    mmapService.open();
    // Write valid state
    mmapService.writeWorldState([{ id: 'test', name: 'valid', x: 0, y: 0, hp: 10, actorType: 0, faction: 'test' }]);
  });

  afterAll(() => {
    mmapService.close();
    if (existsSync(TEST_MMAP_PATH)) rmSync(TEST_MMAP_PATH);
  });

  it('should survive concurrent memory corruption without crashing', async () => {
    const corruptor = spawn('go', ['run', join(__dirname, '../../scripts/mmap-corruptor.go'), TEST_MMAP_PATH]);

    const startTime = Date.now();
    let readCount = 0;
    let corruptedReads = 0;
    
    // Continuously read the world state while the corruptor is running
    await new Promise<void>((resolve, reject) => {
      const interval = setInterval(() => {
        try {
          const blips = mmapService.readWorldState();
          if (blips.length === 0) {
            corruptedReads++;
          }
          readCount++;
        } catch (err: any) {
          // It's acceptable to throw range/allocation errors if count is malformed,
          // as long as it doesn't crash the Node process entirely
          expect(err.message).toMatch(/allocation failed|out of bounds|Invalid/);
        }

        if (Date.now() - startTime > 2500) {
          clearInterval(interval);
          resolve();
        }
      }, 10);

      corruptor.on('error', (e) => {
        clearInterval(interval);
        reject(e);
      });
    });

    // The corruptor process should finish
    expect(readCount).toBeGreaterThan(0);
    expect(corruptedReads).toBeGreaterThan(0);
  }, 10000);
});
