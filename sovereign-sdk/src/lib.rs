pub mod protocol;

use protocol::*;
use std::slice;

/// Validate a SovereignHeader.
#[no_mangle]
pub unsafe extern "C" fn sovereign_header_is_valid(header: *const SovereignHeader) -> bool {
    if header.is_null() {
        return false;
    }
    (*header).is_valid()
}

/// Create a new SovereignHeader.
#[no_mangle]
pub unsafe extern "C" fn sovereign_header_new(
    packet_type: u8,
    sequence_id: u32,
    payload_len: u32,
) -> SovereignHeader {
    // We trust the caller to pass a valid discriminant or we handle it safely
    let p_type = match packet_type {
        0x01 => PacketType::Intent,
        0x02 => PacketType::Result,
        0x03 => PacketType::Heartbeat,
        0x04 => PacketType::Ack,
        _ => PacketType::Heartbeat, // Default to heartbeat if invalid
    };
    SovereignHeader::new(p_type, sequence_id, payload_len)
}

/// Get the size of IntentPacket.
#[no_mangle]
pub extern "C" fn sovereign_intent_packet_size() -> usize {
    std::mem::size_of::<IntentPacket>()
}

/// Get the size of ResultPacket.
#[no_mangle]
pub extern "C" fn sovereign_result_packet_size() -> usize {
    std::mem::size_of::<ResultPacket>()
}

/// Create a new IntentPacket.
#[no_mangle]
pub unsafe extern "C" fn sovereign_intent_packet_new(
    intent_type: u8,
    sequence_id: u32,
    session_id: *const u8,
    actor_id: *const u8,
    payload: *const u8,
) -> IntentPacket {
    let mut sess = [0u8; 16];
    let mut actor = [0u8; 16];
    let mut pay = [0u8; 256];

    if !session_id.is_null() {
        sess.copy_from_slice(slice::from_raw_parts(session_id, 16));
    }
    if !actor_id.is_null() {
        actor.copy_from_slice(slice::from_raw_parts(actor_id, 16));
    }
    if !payload.is_null() {
        pay.copy_from_slice(slice::from_raw_parts(payload, 256));
    }

    let i_type = match intent_type {
        0x01 => IntentType::Roll,
        0x02 => IntentType::Damage,
        0x03 => IntentType::SkillCheck,
        0x04 => IntentType::Heal,
        _ => IntentType::SkillCheck,
    };

    IntentPacket::new(i_type, sequence_id, sess, actor, pay)
}

/// Create a new ResultPacket.
#[no_mangle]
pub unsafe extern "C" fn sovereign_result_packet_new(
    status: u8,
    sequence_id: u32,
    session_id: *const u8,
    result_code: u32,
    payload: *const u8,
) -> ResultPacket {
    let mut sess = [0u8; 16];
    let mut pay = [0u8; 256];

    if !session_id.is_null() {
        sess.copy_from_slice(slice::from_raw_parts(session_id, 16));
    }
    if !payload.is_null() {
        pay.copy_from_slice(slice::from_raw_parts(payload, 256));
    }

    let r_status = match status {
        0x00 => ResultStatus::Ok,
        0x01 => ResultStatus::Error,
        0x02 => ResultStatus::Pending,
        _ => ResultStatus::Error,
    };

    ResultPacket::new(r_status, sequence_id, sess, result_code, pay)
}
