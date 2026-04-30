# AAAK Dialect Specification
**Version:** 1.0
**Date:** 2026-04-14
**Status:** ACTIVE — Standard Cognitive Wire-Format (50V3R31GN-M4CH1N4)

---

## 1. Purpose

AAAK (Atomic Abbreviated Action Key) is the high-density compression dialect used for VSB `0x0A` SovereignContextUpdate packets. Its goal is to maximize tactical state density within the 243-byte UTF-8 payload window while remaining human-readable.

---

## 2. Wire Format

A `0x0A` ContextUpdate carries an AAAK string in the IntentPacket payload at byte offset 12:

```
[0..7]   timestamp  : u64 LE (Unix epoch ms)
[8..11]  context_hash : u32 LE (FNV-1a of the AAAK string)
[12..254] AAAK payload : UTF-8, null-terminated
```

**Integrity:** FNV-1a 32-bit hash (seed `0x811c9dc5`, prime `0x01000193`) — implemented in `SovereignContextUpdateCodec.hash()`.

---

## 3. Token Grammar

Each event is a pipe-separated (`|`) token of the form:

```
#TAG[seq]:summary
```

| Tag     | Meaning                            |
|---------|------------------------------------|
| `#TACT` | Tactical intent (Roll/SkillCheck)  |
| `#FRIC` | Friction state (District/Tension)  |

### Summary Sub-fields

Sub-fields within `summary` use comma-separated `key=value` pairs:

- `REF`, `BODY`, `TECH` — STAT values
- `atk` — attack roll total
- `dv` — difficulty value
- `hit` — `true` / `false`
- `district` — Night City district name
- `tension` — `LOW` / `MED` / `HIGH` / `CRITICAL`
- `hostiles` — integer count

### Example

```
#TACT[1]:REF=8,BODY=6,atk=12,dv=15,hit=true|#FRIC[2]:district=Watson,tension=HIGH,hostiles=3
```

---

## 4. Flush Policy

The Sentinel Distiller (`scripts/dev/sentinel-distiller.ts`) flushes the event buffer to a `0x0A` push on either:
- Every **5 events** (batch flush), or
- On any **`#FRIC`** event (high-priority immediate flush).

---

## 5. Droid CLI Context

AAAK is the **Standard Cognitive Wire-Format** for inter-node state transfer. When a Droid context prompt includes AAAK tokens, they should be decoded per this spec before being surfaced to the Narrative Client or GM interface.

---

*Spec ratified Phase 56 Stabilization. Source of truth: `src/shared/vsb_protocol.ts` `SovereignContextUpdateCodec`.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
