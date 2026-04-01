use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ClawLinkPacket {
    pub trace_id: String,
    pub payload: String,
    pub checksum: u32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_clawlink_packet_serialization() {
        let packet = ClawLinkPacket {
            trace_id: "test-trace".to_string(),
            payload: "test-payload".to_string(),
            checksum: 12345,
        };
        let serialized = serde_json::to_string(&packet).unwrap();
        let deserialized: ClawLinkPacket = serde_json::from_str(&serialized).unwrap();
        assert_eq!(packet.trace_id, deserialized.trace_id);
        assert_eq!(packet.payload, deserialized.payload);
        assert_eq!(packet.checksum, deserialized.checksum);
    }
}
