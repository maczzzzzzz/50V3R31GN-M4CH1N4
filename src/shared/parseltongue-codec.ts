// src/shared/parseltongue-codec.ts
//
// ParseltongueCodec — Invisible Command Protocol (P4RS3LT0NGV3)
//
// Encodes JSON payloads as invisible Unicode Tag Block characters (U+E0000–U+E007F)
// and injects them after benign narrative text ("cloaking").  The decoder scans
// any string for the delimited payload and returns the raw JSON, or null if none.
//
// ── Encoding scheme ───────────────────────────────────────────────────────────
//   START_MARKER : U+E0001  LANGUAGE TAG  (never emitted as a payload char)
//   END_MARKER   : U+E007F  CANCEL TAG    (never emitted as a payload char)
//   Payload char : U+E0000 + codePoint    (mirrors ASCII 0x20–0x7E exactly)
//
// JSON.stringify output is pure printable ASCII (0x20–0x7E), so every character
// maps cleanly into U+E0020–U+E007E — well clear of both delimiters.
//
// ── Wire format ───────────────────────────────────────────────────────────────
//   <visible text><U+E0001><encoded JSON chars><U+E007F>
//
// Invisible to all UI renderers and log scrapers that strip private-use/tag blocks.

import { WorldCommandSchema, type WorldCommand } from './schemas/world-commands.schema.js';

// ── Constants ─────────────────────────────────────────────────────────────────

const TAG_BASE   = 0xE0000;
const START_CHAR = String.fromCodePoint(0xE0001); // LANGUAGE TAG — start delimiter
const END_CHAR   = String.fromCodePoint(0xE007F); // CANCEL TAG   — end delimiter

// Matches one full Parseltongue payload; u flag required for astral code points.
// Group 1 captures the raw tag chars between the delimiters.
// Non-global — used for single extraction.
const PAYLOAD_RE_ONCE = /\u{E0001}([\u{E0020}-\u{E007E}]*)\u{E007F}/u;

// Global variant used for strip (replace-all).
const PAYLOAD_RE_ALL  = /\u{E0001}[\u{E0020}-\u{E007E}]*\u{E007F}/gu;

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Map each character in a printable-ASCII JSON string to its tag-block mirror.
 * Throws if a character falls outside 0x20–0x7E (which JSON.stringify never produces).
 *
 * NOTE: JSON.stringify() is guaranteed to produce only printable ASCII (0x20–0x7E)
 * because non-ASCII values are emitted as \uXXXX escape sequences.
 * We iterate with for...of so that surrogate pairs are consumed as single code points
 * rather than two half-surrogates that would both fail the range check with misleading
 * U+DC00–U+DFFF errors.
 */
function encodeToTags(json: string): string {
  const out: string[] = [];
  let idx = 0;
  for (const ch of json) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x20 || cp > 0x7E) {
      throw new Error(
        `ParseltongueCodec: character U+${cp.toString(16).toUpperCase().padStart(4, '0')} ` +
        `at char index ${idx} is outside printable ASCII (0x20–0x7E). ` +
        `Pass the output of JSON.stringify() — do not pre-process with indentation.`,
      );
    }
    out.push(String.fromCodePoint(TAG_BASE + cp));
    idx++;
  }
  return START_CHAR + out.join('') + END_CHAR;
}

/**
 * Reverse the tag-block mapping for the captured group between the delimiters.
 */
function decodeFromTags(tagChars: string): string {
  const out: string[] = [];
  for (const ch of tagChars) {
    const cp = ch.codePointAt(0)!;
    out.push(String.fromCodePoint(cp - TAG_BASE));
  }
  return out.join('');
}

// ── Public API ────────────────────────────────────────────────────────────────

export class ParseltongueCodec {
  /**
   * Cloak a raw JSON string inside `visibleText`.
   * The invisible tag sequence is appended after the visible characters.
   * The combined output looks identical to `visibleText` in any renderer
   * that strips or ignores the Unicode Tags block.
   *
   * @param visibleText  The atmospheric NPC bark or narrative string.
   * @param jsonPayload  A compact JSON string (output of JSON.stringify with no indentation).
   */
  static cloak(visibleText: string, jsonPayload: string): string {
    return visibleText + encodeToTags(jsonPayload);
  }

  /**
   * Validate and cloak a WorldCommand.
   * Convenience wrapper: serialises `command` to compact JSON then calls cloak().
   */
  static cloakCommand(visibleText: string, command: WorldCommand): string {
    return ParseltongueCodec.cloak(visibleText, JSON.stringify(command));
  }

  /**
   * Scan `text` for an embedded Parseltongue payload.
   * Returns the raw JSON string if a valid payload is found, otherwise null.
   *
   * If multiple payloads are present only the first is returned.
   */
  static scan(text: string): string | null {
    const match = PAYLOAD_RE_ONCE.exec(text);
    if (!match) return null;
    return decodeFromTags(match[1]!);
  }

  /**
   * Scan for a Parseltongue payload and parse it as a Zero-Trust–validated WorldCommand.
   * Returns the WorldCommand if a payload is found AND passes Zod validation, else null.
   */
  static scanForCommand(text: string): WorldCommand | null {
    const json = ParseltongueCodec.scan(text);
    if (json === null) return null;
    try {
      const parsed: unknown = JSON.parse(json);
      const result = WorldCommandSchema.safeParse(parsed);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }

  /**
   * Strip all Parseltongue payloads from `text`, returning only the visible characters.
   * Use for safe logging, display, or export without leaking the covert channel.
   */
  static strip(text: string): string {
    return text.replace(PAYLOAD_RE_ALL, '');
  }

  /**
   * Returns true if `text` contains at least one Parseltongue payload.
   */
  static hasCloakedPayload(text: string): boolean {
    return PAYLOAD_RE_ONCE.test(text);
  }
}
