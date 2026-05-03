/**
 * scripts/stubs.ts
 *
 * Stubs for services migrated from hermes-core to Python/Rust.
 * This file allows legacy TS scripts to typecheck after the deletion of hermes-core.
 */

export class SteganographyService {
  async encodeSecret(inputPath: string, outputPath: string, secret: string): Promise<void> {
    console.log('[Stub:ST3GG] encodeSecret (Redirected to crates/sidecar-cyberdeck)');
  }
  async decodeSecret(inputPath: string): Promise<string> {
    console.log('[Stub:ST3GG] decodeSecret (Redirected to crates/sidecar-cyberdeck)');
    return '{}';
  }
}

export class NanoBananaService {
  async generateTile(options: any): Promise<string> {
    console.log('[Stub:NanoBanana] generateTile (Redirected to sidecars/hermes-agent-nous)');
    return options.outputPath || 'data/assets/tiles/stub.webp';
  }
}

export class UnifiedOracleClient {
  constructor(options?: any) {
    console.log('[Stub:Oracle] constructor');
  }
  async connect(): Promise<void> {
    console.log('[Stub:Oracle] connect');
  }
  async disconnect(): Promise<void> {
    console.log('[Stub:Oracle] disconnect');
  }
  async healthCheck(): Promise<{ connected: boolean }> {
    return { connected: true };
  }
  async getFactionFriction(faction: string): Promise<number> {
    return 0.5;
  }
  async query(q: string): Promise<any[]> {
    console.log('[Stub:Oracle] query');
    return [];
  }
}

export class SoulLogger {
  log(msg: string): void {
    console.log('[Stub:SoulLogger] ' + msg);
  }
}

export interface SoulEntry {
  ts: string;
  level: string;
  msg: string;
  meta?: any;
  content?: string;
  reasoning?: string;
  training_value?: number;
}
