/// VSB Protocol: Sovereign Binary Schema
/// Phase 22.5: Cross-Node Stabilization
///
/// Raw C-style binary structs for sub-1ms serialization over UDP.
///
/// All structs use `#[repr(C, packed)]` — zero padding, deterministic layout,
/// size matches the wire format exactly. Field access MUST be by-value (Rust
/// emits `read_unaligned` implicitly); never take references to struct fields.
///
/// Wire Layout:
///   SovereignHeader : 13 bytes  (magic[2] + version[1] + type[1] + seq[4] + len[4] + csum[1])
///   IntentPacket    : 302 bytes (13 + 1 + 16 + 16 + 256)
///   ResultPacket    : 290 bytes (13 + 1 + 16 + 4  + 256)

// ─── Magic & Version ─────────────────────────────────────────────────────────

pub const VSB_MAGIC: u16 = 0xC0DE;
pub const VSB_VERSION: u8 = 0x01;

// ─── Packet Type Discriminant ─────────────────────────────────────────────────

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PacketType {
    Intent    = 0x01,
    Result    = 0x02,
    Heartbeat = 0x03,
    Ack       = 0x04,
}

// ─── Intent Type Discriminant ────────────────────────────────────────────────

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IntentType {
    Roll       = 0x01,
    Damage     = 0x02,
    SkillCheck = 0x03,
    Heal       = 0x04,
}

// ─── Result Status ───────────────────────────────────────────────────────────

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResultStatus {
    Ok      = 0x00,
    Error   = 0x01,
    Pending = 0x02,
}

// ─── SovereignHeader (13 bytes) ──────────────────────────────────────────────
//
// `#[repr(C, packed)]` eliminates all padding. On x86-64 unaligned u32 reads
// are supported in hardware; `packed` is safe for our UDP-receive-buffer use case.
//
// Byte layout:
//   [0..2]  magic:       u16 LE — 0xC0DE
//   [2]     version:     u8     — 0x01
//   [3]     packet_type: u8     — PacketType discriminant
//   [4..8]  sequence_id: u32 LE — monotonic counter
//   [8..12] payload_len: u32 LE — bytes after this header
//   [12]    checksum:    u8     — XOR of bytes [0..12]

#[repr(C, packed)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SovereignHeader {
    pub magic:       u16,
    pub version:     u8,
    pub packet_type: u8,
    pub sequence_id: u32,
    pub payload_len: u32,
    pub checksum:    u8,
}

const _ASSERT_HEADER_SIZE: () = assert!(
    std::mem::size_of::<SovereignHeader>() == 13,
    "SovereignHeader must be exactly 13 bytes on the wire"
);

impl SovereignHeader {
    pub fn new(packet_type: PacketType, sequence_id: u32, payload_len: u32) -> Self {
        let mut hdr = SovereignHeader {
            magic: VSB_MAGIC,
            version: VSB_VERSION,
            packet_type: packet_type as u8,
            sequence_id,
            payload_len,
            checksum: 0,
        };
        // Safety: hdr is a valid SovereignHeader on the stack.
        hdr.checksum = unsafe { compute_header_checksum(&hdr) };
        hdr
    }

    /// Validate magic, version, and XOR checksum.
    pub fn is_valid(&self) -> bool {
        // Read by-value from packed struct (safe in Rust — emits read_unaligned)
        let magic   = self.magic;
        let version = self.version;
        if magic != VSB_MAGIC || version != VSB_VERSION {
            return false;
        }
        let expected = unsafe { compute_header_checksum(self) };
        self.checksum == expected
    }
}

/// XOR checksum over header bytes [0..12] (excludes the checksum field itself).
///
/// # Safety
/// `hdr` must point to a valid `SovereignHeader` (13 packed bytes).
unsafe fn compute_header_checksum(hdr: &SovereignHeader) -> u8 {
    let ptr = hdr as *const SovereignHeader as *const u8;
    let bytes = std::slice::from_raw_parts(ptr, 12);
    bytes.iter().fold(0u8, |acc, &b| acc ^ b)
}

// ─── IntentPacket (302 bytes) ────────────────────────────────────────────────
//
//   [0..13]   header:      SovereignHeader (13 bytes)
//   [13]      intent_type: u8
//   [14..30]  session_id:  [u8; 16]
//   [30..46]  actor_id:    [u8; 16]
//   [46..302] payload:     [u8; 256]

#[repr(C, packed)]
#[derive(Clone, Copy)]
pub struct IntentPacket {
    pub header:      SovereignHeader,
    pub intent_type: u8,
    pub session_id:  [u8; 16],
    pub actor_id:    [u8; 16],
    pub payload:     [u8; 256],
}

const _ASSERT_INTENT_SIZE: () = assert!(
    std::mem::size_of::<IntentPacket>() == 302,
    "IntentPacket must be exactly 302 bytes on the wire"
);

impl IntentPacket {
    pub fn new(
        intent_type: IntentType,
        sequence_id: u32,
        session_id: [u8; 16],
        actor_id: [u8; 16],
        payload: [u8; 256],
    ) -> Self {
        IntentPacket {
            header: SovereignHeader::new(PacketType::Intent, sequence_id, 256),
            intent_type: intent_type as u8,
            session_id,
            actor_id,
            payload,
        }
    }
}

// ─── ResultPacket (290 bytes) ────────────────────────────────────────────────
//
//   [0..13]   header:      SovereignHeader (13 bytes)
//   [13]      status:      u8
//   [14..30]  session_id:  [u8; 16]
//   [30..34]  result_code: u32 LE
//   [34..290] payload:     [u8; 256]

#[repr(C, packed)]
#[derive(Clone, Copy)]
pub struct ResultPacket {
    pub header:      SovereignHeader,
    pub status:      u8,
    pub session_id:  [u8; 16],
    pub result_code: u32,
    pub payload:     [u8; 256],
}

const _ASSERT_RESULT_SIZE: () = assert!(
    std::mem::size_of::<ResultPacket>() == 290,
    "ResultPacket must be exactly 290 bytes on the wire"
);

impl ResultPacket {
    pub fn new(
        status: ResultStatus,
        sequence_id: u32,
        session_id: [u8; 16],
        result_code: u32,
        payload: [u8; 256],
    ) -> Self {
        ResultPacket {
            header: SovereignHeader::new(PacketType::Result, sequence_id, 273),
            status: status as u8,
            session_id,
            result_code,
            payload,
        }
    }
}

// ─── Zero-Copy Byte Helpers ──────────────────────────────────────────────────

/// Cast a packed VSB struct to a byte slice. Zero allocation, zero copy.
///
/// # Safety
/// `T` must be `#[repr(C, packed)]`. All VSB structs in this file satisfy
/// this by construction; size is verified by static assertions.
pub unsafe fn as_bytes<T: Sized>(val: &T) -> &[u8] {
    std::slice::from_raw_parts(val as *const T as *const u8, std::mem::size_of::<T>())
}

/// Reconstruct a packed VSB struct from a byte slice via `read_unaligned`.
/// Returns `None` if the slice is too short.
///
/// # Safety
/// Caller is responsible for calling `header.is_valid()` after reconstruction
/// to verify magic, version, and checksum before trusting any field values.
pub unsafe fn from_bytes<T: Copy>(bytes: &[u8]) -> Option<T> {
    if bytes.len() < std::mem::size_of::<T>() {
        return None;
    }
    // `read_unaligned` handles any byte alignment — safe for packed structs
    // loaded from a UDP receive buffer.
    Some(std::ptr::read_unaligned(bytes.as_ptr() as *const T))
}

// ─── Tests ───────────────────────────────────────────────────────────────────
//
// NOTE: All multi-byte fields of `#[repr(C, packed)]` structs MUST be copied
// to a local variable before use in `assert_eq!` / method calls. The macro
// expands to `match (&left, &right)` which takes a reference — that is UB for
// a packed field whose address may not satisfy the type's alignment requirement.
// Copying to a stack local produces a properly-aligned slot.

#[cfg(test)]
mod tests {
    use super::*;

    // ── Header ────────────────────────────────────────────────────────────────

    #[test]
    fn test_sovereign_header_is_exactly_13_bytes() {
        assert_eq!(std::mem::size_of::<SovereignHeader>(), 13);
    }

    #[test]
    fn test_sovereign_header_round_trip() {
        let original = SovereignHeader::new(PacketType::Intent, 42, 256);

        let bytes = unsafe { as_bytes(&original) };
        assert_eq!(bytes.len(), 13);

        let recovered: SovereignHeader = unsafe { from_bytes(bytes) }
            .expect("from_bytes must succeed for a 13-byte slice");

        // Copy multi-byte fields to locals before asserting (packed struct safety)
        let magic       = recovered.magic;
        let sequence_id = recovered.sequence_id;
        let payload_len = recovered.payload_len;

        assert_eq!(magic,                VSB_MAGIC);
        assert_eq!(recovered.version,    VSB_VERSION);      // u8 — alignment 1, safe
        assert_eq!(recovered.packet_type, PacketType::Intent as u8); // u8
        assert_eq!(sequence_id,          42);
        assert_eq!(payload_len,          256);
        assert!(recovered.is_valid(), "recovered header checksum must pass");
    }

    #[test]
    fn test_sovereign_header_checksum_detects_corruption() {
        let original = SovereignHeader::new(PacketType::Intent, 1, 0);
        let bytes = unsafe { as_bytes(&original) };

        let mut buf = [0u8; 13];
        buf.copy_from_slice(bytes);
        buf[4] ^= 0xFF; // corrupt first byte of sequence_id

        let corrupted: SovereignHeader = unsafe { from_bytes(&buf) }.unwrap();
        assert!(!corrupted.is_valid(), "corrupted header must fail checksum");
    }

    #[test]
    fn test_sovereign_header_wrong_magic_rejected() {
        let original = SovereignHeader::new(PacketType::Heartbeat, 0, 0);
        let bytes = unsafe { as_bytes(&original) };

        let mut buf = [0u8; 13];
        buf.copy_from_slice(bytes);
        buf[0] = 0xDE;
        buf[1] = 0xAD; // break magic (was 0xDE 0xC0)

        let bad: SovereignHeader = unsafe { from_bytes(&buf) }.unwrap();
        assert!(!bad.is_valid(), "wrong magic must fail validation");
    }

    #[test]
    fn test_header_magic_little_endian_bytes() {
        let hdr = SovereignHeader::new(PacketType::Ack, 0, 0);
        let bytes = unsafe { as_bytes(&hdr) };
        // 0xC0DE in little-endian → [0xDE, 0xC0]
        assert_eq!(bytes[0], 0xDE);
        assert_eq!(bytes[1], 0xC0);
    }

    #[test]
    fn test_packet_type_at_byte_offset_3() {
        let hdr = SovereignHeader::new(PacketType::Result, 0, 0);
        let bytes = unsafe { as_bytes(&hdr) };
        assert_eq!(bytes[3], PacketType::Result as u8);
    }

    // ── IntentPacket ──────────────────────────────────────────────────────────

    #[test]
    fn test_intent_packet_is_exactly_302_bytes() {
        assert_eq!(std::mem::size_of::<IntentPacket>(), 302);
    }

    #[test]
    fn test_intent_packet_round_trip() {
        let session_id = [0xAB; 16];
        let actor_id   = [0xCD; 16];
        let mut payload = [0u8; 256];
        payload[0] = b'R'; // ROLL tag
        payload[1] = 0x01; // STAT
        payload[2] = 0x06; // SKILL

        let pkt = IntentPacket::new(IntentType::Roll, 1, session_id, actor_id, payload);

        let bytes = unsafe { as_bytes(&pkt) };
        assert_eq!(bytes.len(), 302);

        let recovered: IntentPacket = unsafe { from_bytes(bytes) }
            .expect("from_bytes must succeed for a 302-byte intent packet");

        // Copy embedded header to aligned local before method call / assert
        let hdr = recovered.header;
        assert!(hdr.is_valid());
        assert_eq!(hdr.packet_type, PacketType::Intent as u8); // u8 — safe
        assert_eq!(recovered.intent_type, IntentType::Roll as u8);
        assert_eq!(recovered.session_id, session_id);
        assert_eq!(recovered.actor_id,   actor_id);
        assert_eq!(recovered.payload[0], b'R');
        assert_eq!(recovered.payload[1], 0x01);
        assert_eq!(recovered.payload[2], 0x06);
    }

    #[test]
    fn test_intent_packet_header_at_byte_0() {
        let pkt = IntentPacket::new(
            IntentType::Damage,
            99,
            [0u8; 16],
            [0u8; 16],
            [0u8; 256],
        );
        let bytes = unsafe { as_bytes(&pkt) };
        // Header magic at [0..2]
        assert_eq!(bytes[0], 0xDE);
        assert_eq!(bytes[1], 0xC0);
        // intent_type at [13]
        assert_eq!(bytes[13], IntentType::Damage as u8);
    }

    // ── ResultPacket ──────────────────────────────────────────────────────────

    #[test]
    fn test_result_packet_is_exactly_290_bytes() {
        assert_eq!(std::mem::size_of::<ResultPacket>(), 290);
    }

    #[test]
    fn test_result_packet_round_trip() {
        let session_id = [0x12; 16];
        let mut payload = [0u8; 256];
        payload[0] = 17;

        let pkt = ResultPacket::new(ResultStatus::Ok, 1, session_id, 17, payload);

        let bytes = unsafe { as_bytes(&pkt) };
        assert_eq!(bytes.len(), 290);

        let recovered: ResultPacket = unsafe { from_bytes(bytes) }
            .expect("from_bytes must succeed for a 290-byte result packet");

        // Copy header and multi-byte fields to aligned locals
        let hdr         = recovered.header;
        let result_code = recovered.result_code;

        assert!(hdr.is_valid());
        assert_eq!(hdr.packet_type,     PacketType::Result as u8); // u8
        assert_eq!(recovered.status,    ResultStatus::Ok as u8);   // u8
        assert_eq!(recovered.session_id, session_id);
        assert_eq!(result_code,         17);
        assert_eq!(recovered.payload[0], 17);
    }

    #[test]
    fn test_result_packet_result_code_at_offset_30() {
        let pkt = ResultPacket::new(
            ResultStatus::Ok,
            0,
            [0u8; 16],
            0x0A0B0C0D,
            [0u8; 256],
        );
        let bytes = unsafe { as_bytes(&pkt) };
        // result_code: u32 LE at [30..34]
        let rc = u32::from_le_bytes([bytes[30], bytes[31], bytes[32], bytes[33]]);
        assert_eq!(rc, 0x0A0B0C0D);
    }

    // ── Cross-packet isolation ────────────────────────────────────────────────

    #[test]
    fn test_truncated_slice_returns_none_for_header() {
        let buf = [0u8; 12]; // one byte short
        let result: Option<SovereignHeader> = unsafe { from_bytes(&buf) };
        assert!(result.is_none());
    }

    #[test]
    fn test_truncated_slice_returns_none_for_intent() {
        let buf = [0u8; 301]; // one byte short
        let result: Option<IntentPacket> = unsafe { from_bytes(&buf) };
        assert!(result.is_none());
    }
}
