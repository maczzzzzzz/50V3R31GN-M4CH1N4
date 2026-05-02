/**
 * tests/shared/parseltongue-codec.test.ts
 *
 * Unit tests for ParseltongueCodec — the Invisible Command Protocol.
 * Validates encoding fidelity, round-trip correctness, Zero-Trust parsing,
 * and the public cloak/scan/strip surface area.
 */

import { describe, it, expect } from 'vitest';
import { ParseltongueCodec } from '../../packages/hermes-core/src/shared/parseltongue-codec.js';
import type { WorldCommand } from '../../packages/hermes-core/src/shared/schemas/world-commands.schema.js';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const UPDATE_NPC_CMD: WorldCommand = {
  action: 'UPDATE_NPC',
  target: 'npc_maelstrom_001',
  data: { hp: 28, disposition: 'hostile' },
};

const ADD_LORE_CMD: WorldCommand = {
  action: 'ADD_LORE',
  subject: 'Maelstrom',
  predicate: 'controls',
  object: 'Totentanz',
};

const TRANSFER_ITEM_CMD: WorldCommand = {
  action: 'TRANSFER_ITEM',
  itemId: 'item_thermal_katana',
  fromId: 'npc_maelstrom_001',
  toId: 'player_v',
};

const VISIBLE_BARK = 'Vekh ra-koru. Tse zheva-da!';

// ── ParseltongueCodec.cloak + scan (round-trip) ───────────────────────────────

describe('ParseltongueCodec.cloak / scan round-trip', () => {
  it('scan returns the original JSON after cloak', () => {
    const json = JSON.stringify(UPDATE_NPC_CMD);
    const cloaked = ParseltongueCodec.cloak(VISIBLE_BARK, json);
    const recovered = ParseltongueCodec.scan(cloaked);
    expect(recovered).toBe(json);
  });

  it('scan returns null for plain text with no payload', () => {
    expect(ParseltongueCodec.scan(VISIBLE_BARK)).toBeNull();
  });

  it('scan returns null for empty string', () => {
    expect(ParseltongueCodec.scan('')).toBeNull();
  });

  it('cloaked string starts with the visible bark', () => {
    const cloaked = ParseltongueCodec.cloak(VISIBLE_BARK, JSON.stringify(UPDATE_NPC_CMD));
    expect(cloaked.startsWith(VISIBLE_BARK)).toBe(true);
  });

  it('cloaked string length is greater than visible bark length', () => {
    const json = JSON.stringify(UPDATE_NPC_CMD);
    const cloaked = ParseltongueCodec.cloak(VISIBLE_BARK, json);
    // invisible tags add START(1) + json.length + END(1) chars
    expect([...cloaked].length).toBe([...VISIBLE_BARK].length + json.length + 2);
  });

  it('round-trips a JSON string with special chars (braces, colons, quotes)', () => {
    const json = JSON.stringify({ key: 'va"lue', nested: { a: 1 } });
    const cloaked = ParseltongueCodec.cloak('bark', json);
    expect(ParseltongueCodec.scan(cloaked)).toBe(json);
  });

  it('round-trips all three WorldCommand variants', () => {
    for (const cmd of [UPDATE_NPC_CMD, ADD_LORE_CMD, TRANSFER_ITEM_CMD]) {
      const json = JSON.stringify(cmd);
      const cloaked = ParseltongueCodec.cloak('NPC bark text', json);
      expect(ParseltongueCodec.scan(cloaked)).toBe(json);
    }
  });
});

// ── ParseltongueCodec.cloakCommand + scanForCommand ───────────────────────────

describe('ParseltongueCodec.cloakCommand / scanForCommand', () => {
  it('scanForCommand recovers a valid WorldCommand', () => {
    const cloaked = ParseltongueCodec.cloakCommand(VISIBLE_BARK, UPDATE_NPC_CMD);
    const recovered = ParseltongueCodec.scanForCommand(cloaked);
    expect(recovered).toEqual(UPDATE_NPC_CMD);
  });

  it('scanForCommand returns null for clean text', () => {
    expect(ParseltongueCodec.scanForCommand(VISIBLE_BARK)).toBeNull();
  });

  it('scanForCommand returns null when payload is valid JSON but not a WorldCommand', () => {
    // Payload passes JSON.parse but fails WorldCommandSchema
    const malformed = ParseltongueCodec.cloak(VISIBLE_BARK, JSON.stringify({ action: 'UNKNOWN_OP' }));
    expect(ParseltongueCodec.scanForCommand(malformed)).toBeNull();
  });

  it('scanForCommand returns null when payload is not valid JSON', () => {
    // Manually cloak a non-JSON string
    const corruptCloaked = ParseltongueCodec.cloak(VISIBLE_BARK, 'not-json{{');
    expect(ParseltongueCodec.scanForCommand(corruptCloaked)).toBeNull();
  });

  it('correctly handles UPDATE_NPC with partial data fields', () => {
    const cmd: WorldCommand = {
      action: 'UPDATE_NPC',
      target: 'npc_arasaka_guard',
      data: { is_alive: false },
    };
    const cloaked = ParseltongueCodec.cloakCommand('Guard down.', cmd);
    expect(ParseltongueCodec.scanForCommand(cloaked)).toEqual(cmd);
  });

  it('correctly handles TRANSFER_ITEM command', () => {
    const cloaked = ParseltongueCodec.cloakCommand('Transaction complete.', TRANSFER_ITEM_CMD);
    expect(ParseltongueCodec.scanForCommand(cloaked)).toEqual(TRANSFER_ITEM_CMD);
  });

  it('correctly handles ADD_LORE command', () => {
    const cloaked = ParseltongueCodec.cloakCommand('The gang spreads its influence.', ADD_LORE_CMD);
    expect(ParseltongueCodec.scanForCommand(cloaked)).toEqual(ADD_LORE_CMD);
  });
});

// ── ParseltongueCodec.strip ───────────────────────────────────────────────────

describe('ParseltongueCodec.strip', () => {
  it('strip returns only the visible bark', () => {
    const cloaked = ParseltongueCodec.cloakCommand(VISIBLE_BARK, UPDATE_NPC_CMD);
    expect(ParseltongueCodec.strip(cloaked)).toBe(VISIBLE_BARK);
  });

  it('strip is idempotent on clean text', () => {
    expect(ParseltongueCodec.strip(VISIBLE_BARK)).toBe(VISIBLE_BARK);
  });

  it('strip removes multiple consecutive payloads', () => {
    const cloaked1 = ParseltongueCodec.cloakCommand('First.', UPDATE_NPC_CMD);
    const cloaked2 = ParseltongueCodec.cloakCommand('Second.', ADD_LORE_CMD);
    const combined = cloaked1 + ' ' + cloaked2;
    expect(ParseltongueCodec.strip(combined)).toBe('First. Second.');
  });
});

// ── ParseltongueCodec.hasCloakedPayload ──────────────────────────────────────

describe('ParseltongueCodec.hasCloakedPayload', () => {
  it('returns true for cloaked text', () => {
    const cloaked = ParseltongueCodec.cloakCommand(VISIBLE_BARK, UPDATE_NPC_CMD);
    expect(ParseltongueCodec.hasCloakedPayload(cloaked)).toBe(true);
  });

  it('returns false for clean text', () => {
    expect(ParseltongueCodec.hasCloakedPayload(VISIBLE_BARK)).toBe(false);
  });
});

// ── Encoding safety ───────────────────────────────────────────────────────────

describe('ParseltongueCodec encoding safety', () => {
  it('throws when a non-printable ASCII char is passed directly', () => {
    // Simulate someone passing a string with a raw newline (0x0A)
    expect(() => ParseltongueCodec.cloak('bark', 'line1\nline2')).toThrow(
      /outside printable ASCII/,
    );
  });

  it('does NOT throw for compact JSON.stringify output', () => {
    // All chars in compact JSON output are printable ASCII
    const json = JSON.stringify({ action: 'ADD_LORE', subject: 'V', predicate: 'seeks', object: 'Relic' });
    expect(() => ParseltongueCodec.cloak('bark', json)).not.toThrow();
  });

  it('throws for a string containing an astral code point (emoji)', () => {
    // U+1F600 is represented as a surrogate pair in UTF-16; for...of iteration
    // reads it as a single code point (0x1F600) which is > 0x7E.
    expect(() => ParseltongueCodec.cloak('bark', 'value\u{1F600}more'))
      .toThrow(/outside printable ASCII/);
  });
});

// ── Invisibility contract ─────────────────────────────────────────────────────

describe('Invisibility contract', () => {
  it('cloaked string contains no visible-range chars beyond the bark', () => {
    const bark = 'Unit test bark.';
    const cloaked = ParseltongueCodec.cloakCommand(bark, UPDATE_NPC_CMD);

    // Strip tag-block characters (U+E0000–U+E007F) and verify only bark remains
    // eslint-disable-next-line no-control-regex
    const strippedByRegex = cloaked.replace(/[\u{E0000}-\u{E007F}]/gu, '');
    expect(strippedByRegex).toBe(bark);
  });

  it('first scan call does not consume state for subsequent calls (regex not stateful)', () => {
    const cloaked = ParseltongueCodec.cloakCommand(VISIBLE_BARK, UPDATE_NPC_CMD);
    const first  = ParseltongueCodec.scan(cloaked);
    const second = ParseltongueCodec.scan(cloaked);
    expect(first).toBe(second);
  });
});
