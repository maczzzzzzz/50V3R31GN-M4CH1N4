/**
 * TDD Tests: FoundryAdapter
 *
 * Tests for the Node B WebSocket server that accepts outbound connections
 * from the Foundry VTT bridge module. Covers the full command lifecycle
 * and request/response correlation.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import WebSocket, { WebSocketServer } from 'ws';
import { FoundryAdapter } from '../../src/api/foundry-adapter.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

const TEST_PORT = 33099;

/**
 * Creates a mock Foundry client (simulates the Foundry module connecting out).
 * Returns ws client + a helper to send a response with a given requestId.
 */
async function connectMockFoundry(port: number): Promise<{
  client: WebSocket;
  sendResponse: (requestId: string, data?: unknown, error?: string) => void;
  receivedMessages: Array<Record<string, unknown>>;
  close: () => void;
}> {
  const receivedMessages: Array<Record<string, unknown>> = [];

  const client = new WebSocket(`ws://localhost:${port}`);

  await new Promise<void>((resolve, reject) => {
    client.once('open', resolve);
    client.once('error', reject);
  });

  client.on('message', (raw) => {
    receivedMessages.push(JSON.parse(raw.toString()));
  });

  const sendResponse = (requestId: string, data?: unknown, error?: string): void => {
    const payload = error
      ? { type: 'error', requestId, message: error }
      : { type: 'success', requestId, data: data ?? null };
    client.send(JSON.stringify(payload));
  };

  const close = () => client.close();

  return { client, sendResponse, receivedMessages, close };
}

/** Wait for the mock client to receive N messages (with timeout). */
async function waitForMessages(
  messages: Array<Record<string, unknown>>,
  count: number,
  timeoutMs = 2000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (messages.length < count) {
    if (Date.now() > deadline) throw new Error(`Timeout: expected ${count} messages, got ${messages.length}`);
    await new Promise(r => setTimeout(r, 10));
  }
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('FoundryAdapter', () => {
  let adapter: FoundryAdapter;

  beforeEach(() => {
    adapter = new FoundryAdapter();
  });

  afterEach(async () => {
    await adapter.stop();
  });

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  describe('lifecycle', () => {
    it('starts a WebSocket server on the given port', async () => {
      await adapter.start(TEST_PORT);

      // If start threw, the test would fail. Now verify we can connect.
      const client = new WebSocket(`ws://localhost:${TEST_PORT}`);
      await new Promise<void>((res, rej) => {
        client.once('open', res);
        client.once('error', rej);
      });
      client.close();
    });

    it('reports isConnected() = false before any client connects', async () => {
      await adapter.start(TEST_PORT);
      expect(adapter.isConnected()).toBe(false);
    });

    it('reports isConnected() = true after Foundry module connects', async () => {
      await adapter.start(TEST_PORT);
      const { close } = await connectMockFoundry(TEST_PORT);

      // Give the server time to register the connection
      await new Promise(r => setTimeout(r, 50));
      expect(adapter.isConnected()).toBe(true);
      close();
    });

    it('reports isConnected() = false after the client disconnects', async () => {
      await adapter.start(TEST_PORT);
      const { close } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      close();
      await new Promise(r => setTimeout(r, 100));
      expect(adapter.isConnected()).toBe(false);
    });

    it('stop() closes the server cleanly', async () => {
      await adapter.start(TEST_PORT);
      await adapter.stop();

      // Attempting to connect after stop should fail
      await expect(
        new Promise<void>((_, rej) => {
          const c = new WebSocket(`ws://localhost:${TEST_PORT}`);
          c.once('error', rej);
          c.once('open', () => rej(new Error('Should not connect')));
        }),
      ).rejects.toThrow();
    });
  });

  // ── sendChatMessage ─────────────────────────────────────────────────────────

  describe('sendChatMessage', () => {
    it('sends a chat_message command with content and speaker', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.sendChatMessage('Hello Night City', { alias: 'GM Assistant' });

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];

      expect(cmd.type).toBe('chat_message');
      expect((cmd.payload as { content: string }).content).toBe('Hello Night City');
      expect((cmd.payload as { speaker: { alias: string } }).speaker.alias).toBe('GM Assistant');
      expect(typeof cmd.requestId).toBe('string');
      expect((cmd.requestId as string).length).toBe(9);

      // Complete the request
      sendResponse(cmd.requestId as string);
      await expect(promise).resolves.toBeUndefined();
    });

    it('sends chat_message without speaker (optional)', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.sendChatMessage('Test message');
      await waitForMessages(receivedMessages, 1);
      sendResponse(receivedMessages[0].requestId as string);
      await expect(promise).resolves.toBeUndefined();
    });

    it('rejects if Foundry returns an error response', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.sendChatMessage('Test');
      await waitForMessages(receivedMessages, 1);
      sendResponse(receivedMessages[0].requestId as string, undefined, 'Foundry internal error');

      await expect(promise).rejects.toThrow('Foundry internal error');
    });

    it('rejects if no Foundry client is connected', async () => {
      await adapter.start(TEST_PORT);
      await expect(adapter.sendChatMessage('Test')).rejects.toThrow('not connected');
    });
  });

  // ── readActor ───────────────────────────────────────────────────────────────

  describe('readActor', () => {
    it('sends a read_actor command and returns actor data', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const actorData = { name: 'Johnny Silverhand', hp: 40 };
      const promise = adapter.readActor('actor-abc-123');

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];
      expect(cmd.type).toBe('read_actor');
      expect((cmd.payload as { actorId: string }).actorId).toBe('actor-abc-123');

      sendResponse(cmd.requestId as string, actorData);
      await expect(promise).resolves.toEqual(actorData);
    });

    it('rejects if Foundry returns an error for readActor', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.readActor('bad-id');
      await waitForMessages(receivedMessages, 1);
      sendResponse(receivedMessages[0].requestId as string, undefined, 'Actor not found');

      await expect(promise).rejects.toThrow('Actor not found');
    });
  });

  // ── triggerSimplePhone ──────────────────────────────────────────────────────

  describe('triggerSimplePhone', () => {
    it('sends a simple_phone command with correct payload', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.triggerSimplePhone('555-ROGUE', 'Got a job for you, choom.');

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];
      expect(cmd.type).toBe('simple_phone');
      const payload = cmd.payload as { senderNumber: string; body: string; app: string; messageType: string };
      expect(payload.senderNumber).toBe('555-ROGUE');
      expect(payload.body).toBe('Got a job for you, choom.');
      expect(payload.app).toBe('messages');
      expect(payload.messageType).toBe('text');

      sendResponse(cmd.requestId as string);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  // ── rollDice ────────────────────────────────────────────────────────────────

  describe('rollDice', () => {
    it('sends a dice_roll command and returns the numeric result', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.rollDice('1d10');

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];
      expect(cmd.type).toBe('dice_roll');
      expect((cmd.payload as { formula: string }).formula).toBe('1d10');

      sendResponse(cmd.requestId as string, { result: 7 });
      await expect(promise).resolves.toEqual({ result: 7 });
    });
  });

  // ── activateScene ───────────────────────────────────────────────────────────

  describe('activateScene', () => {
    it('sends a scene_activate command', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.activateScene('scene-afterlife-001');

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];
      expect(cmd.type).toBe('scene_activate');
      expect((cmd.payload as { sceneId: string }).sceneId).toBe('scene-afterlife-001');

      sendResponse(cmd.requestId as string);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  // ── openNightMarket ─────────────────────────────────────────────────────────

  describe('openNightMarket', () => {
    it('sends an open_night_market command with items payload', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const items = [
        { id: 'item-1', name: 'Cyberdeck', description: 'A hacking rig', costEb: 500, costEagles: 3, vendor: 'Mr. Connors' },
      ];
      const promise = adapter.openNightMarket('actor-v-001', 'Mr. Connors', items);

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];
      expect(cmd.type).toBe('open_night_market');
      const payload = cmd.payload as { actorId: string; vendorName: string; items: unknown[] };
      expect(payload.actorId).toBe('actor-v-001');
      expect(payload.vendorName).toBe('Mr. Connors');
      expect(payload.items).toHaveLength(1);

      sendResponse(cmd.requestId as string);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  // ── createActor ─────────────────────────────────────────────────────────────

  describe('createActor', () => {
    it('sends a create_actor command and returns the new actorId', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const createPayload = {
        name: 'V',
        role: 'Solo',
        stats: { INT: 7, REF: 8, DEX: 7, TECH: 5, COOL: 6, WILL: 6, LUCK: 5, MOVE: 6, BODY: 7, EMP: 6 },
        bio: 'A mercenary working out of Night City.',
        seedItems: ['Assault Rifle', 'Light Armorjack'],
      };

      const promise = adapter.createActor(createPayload);

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];

      expect(cmd.type).toBe('create_actor');
      const payload = cmd.payload as typeof createPayload;
      expect(payload.name).toBe('V');
      expect(payload.role).toBe('Solo');
      expect(payload.stats['INT']).toBe(7);
      expect(payload.stats['REF']).toBe(8);
      expect(payload.bio).toBe('A mercenary working out of Night City.');
      expect(payload.seedItems).toEqual(['Assault Rifle', 'Light Armorjack']);
      expect(typeof cmd.requestId).toBe('string');
      expect((cmd.requestId as string).length).toBe(9);

      sendResponse(cmd.requestId as string, { actorId: 'actor-new-001' });
      await expect(promise).resolves.toEqual({ actorId: 'actor-new-001' });
    });

    it('sends a create_actor command with empty seedItems and no bio', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.createActor({
        name: 'Ghost NPC',
        role: 'Fixer',
        stats: { INT: 6, REF: 5, DEX: 5, TECH: 4, COOL: 8, WILL: 7, LUCK: 4, MOVE: 5, BODY: 4, EMP: 7 },
        bio: '',
        seedItems: [],
      });

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];
      expect(cmd.type).toBe('create_actor');

      sendResponse(cmd.requestId as string, { actorId: 'actor-npc-002' });
      await expect(promise).resolves.toEqual({ actorId: 'actor-npc-002' });
    });

    it('rejects if Foundry returns an error for createActor', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.createActor({
        name: 'Bad Actor',
        role: 'Solo',
        stats: { INT: 5, REF: 5, DEX: 5, TECH: 5, COOL: 5, WILL: 5, LUCK: 5, MOVE: 5, BODY: 5, EMP: 5 },
        bio: 'Will fail',
        seedItems: [],
      });

      await waitForMessages(receivedMessages, 1);
      sendResponse(receivedMessages[0].requestId as string, undefined, 'Actor.create() returned null');

      await expect(promise).rejects.toThrow('Actor.create() returned null');
    });

    it('rejects if no Foundry client is connected', async () => {
      await adapter.start(TEST_PORT);
      await expect(adapter.createActor({
        name: 'Disconnected',
        role: 'Netrunner',
        stats: { INT: 9, REF: 6, DEX: 6, TECH: 8, COOL: 5, WILL: 5, LUCK: 4, MOVE: 5, BODY: 4, EMP: 5 },
        bio: 'Never lands',
        seedItems: [],
      })).rejects.toThrow('not connected');
    });
  });

  // ── requestId ───────────────────────────────────────────────────────────────

  describe('requestId generation', () => {
    it('generates unique 9-character alphanumeric requestIds', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const p1 = adapter.sendChatMessage('Message 1');
      const p2 = adapter.sendChatMessage('Message 2');

      await waitForMessages(receivedMessages, 2);

      const id1 = receivedMessages[0].requestId as string;
      const id2 = receivedMessages[1].requestId as string;

      expect(id1).toMatch(/^[a-z0-9]{9}$/);
      expect(id2).toMatch(/^[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);

      sendResponse(id1);
      sendResponse(id2);
      await Promise.all([p1, p2]);
    });
  });

  // ── command timeout ─────────────────────────────────────────────────────────

  describe('command timeout', () => {
    it('rejects with timeout error if Foundry does not respond within timeoutMs', async () => {
      const shortTimeoutAdapter = new FoundryAdapter({ commandTimeoutMs: 100 });
      await shortTimeoutAdapter.start(TEST_PORT);

      try {
        await connectMockFoundry(TEST_PORT);
        await new Promise(r => setTimeout(r, 50));

        await expect(shortTimeoutAdapter.sendChatMessage('Will timeout')).rejects.toThrow(/timeout/i);
      } finally {
        await shortTimeoutAdapter.stop();
      }
    });
  });

  // ── advancePhase ────────────────────────────────────────────────────────────

  describe('advancePhase()', () => {
    it('sends an advance_phase command with correct sceneId and phaseIndex payload', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.advancePhase('scene-downtown-001', 3);

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];

      expect(cmd.type).toBe('advance_phase');
      const payload = cmd.payload as { sceneId: string | null; phaseIndex: number };
      expect(payload.sceneId).toBe('scene-downtown-001');
      expect(payload.phaseIndex).toBe(3);
      expect(typeof cmd.requestId).toBe('string');
      expect((cmd.requestId as string).length).toBe(9);

      sendResponse(cmd.requestId as string);
      await expect(promise).resolves.toBeUndefined();
    });

    it('sends advance_phase with null sceneId (active scene)', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.advancePhase(null, 0);

      await waitForMessages(receivedMessages, 1);
      const cmd = receivedMessages[0];

      expect(cmd.type).toBe('advance_phase');
      const payload = cmd.payload as { sceneId: string | null; phaseIndex: number };
      expect(payload.sceneId).toBeNull();
      expect(payload.phaseIndex).toBe(0);

      sendResponse(cmd.requestId as string);
      await expect(promise).resolves.toBeUndefined();
    });

    it('resolves when Foundry responds with success', async () => {
      await adapter.start(TEST_PORT);
      const { sendResponse, receivedMessages } = await connectMockFoundry(TEST_PORT);
      await new Promise(r => setTimeout(r, 50));

      const promise = adapter.advancePhase(null, 2);

      await waitForMessages(receivedMessages, 1);
      sendResponse(receivedMessages[0].requestId as string);

      await expect(promise).resolves.toBeUndefined();
    });

    it('rejects when Foundry is not connected (throws "not connected")', async () => {
      await adapter.start(TEST_PORT);
      await expect(adapter.advancePhase(null, 1)).rejects.toThrow('not connected');
    });
  });
});
