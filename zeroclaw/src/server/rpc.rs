// zeroclaw/src/server/rpc.rs
//
// JSON-RPC 2.0-inspired wire types for the ClawLink transport.
//
// Frame format: single JSON object terminated by '\n' (newline-delimited JSON).
// One request per frame. One response per frame. No batching.

use serde::{Deserialize, Serialize};

/// Inbound request frame from Node B.
#[derive(Debug, Deserialize)]
pub struct RpcRequest {
    /// Caller-assigned correlation ID. Echoed in the response.
    pub id: String,
    /// Method name: "hybrid_search" | "resolve_attack" | "resolve_damage" | "ping"
    pub method: String,
    /// Method-specific parameters as a JSON object.
    pub params: serde_json::Value,
}

/// Outbound response frame to Node B.
#[derive(Debug, Serialize)]
pub struct RpcResponse {
    /// Echoed from the request.
    pub id: String,
    /// Present on success. Absent on error.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    /// Present on error. Absent on success.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

impl RpcResponse {
    pub fn ok(id: impl Into<String>, result: serde_json::Value) -> Self {
        Self { id: id.into(), result: Some(result), error: None }
    }

    pub fn err(id: impl Into<String>, message: impl Into<String>) -> Self {
        Self { id: id.into(), result: None, error: Some(message.into()) }
    }
}

// ── Method parameter structs ──────────────────────────────────────────────────

/// Parameters for the `hybrid_search` method.
#[derive(Debug, Deserialize)]
pub struct HybridSearchParams {
    pub query: String,
    pub namespace: String,
    pub top_k: usize,
}

/// Parameters for the `resolve_attack` method.
/// Callers (Node B) supply pre-rolled dice; ZeroClaw does the arithmetic.
#[derive(Debug, Deserialize)]
pub struct ResolveAttackParams {
    /// d10 roll chain: [first_die, crit_extension?, ...]
    pub dice: Vec<i32>,
    /// Relevant stat (REF for ranged, BODY for melee).
    pub stat: i32,
    /// Relevant skill level.
    pub skill: i32,
    /// Target Difficulty Value.
    pub dv: i32,
}

/// Parameters for the `resolve_damage` method.
#[derive(Debug, Deserialize)]
pub struct ResolveDamageParams {
    /// Pre-rolled damage dice values.
    pub dice: Vec<i32>,
    /// Flat damage bonus (may be 0 or negative).
    pub bonus: i32,
    /// Target armour Stopping Power.
    pub armour_sp: i32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rpc_response_ok_omits_error_field() {
        let r = RpcResponse::ok("req-1", serde_json::json!({ "hit": true }));
        let json = serde_json::to_string(&r).unwrap();
        assert!(json.contains("\"result\""));
        assert!(!json.contains("\"error\""));
    }

    #[test]
    fn test_rpc_response_err_omits_result_field() {
        let r = RpcResponse::err("req-2", "unknown method");
        let json = serde_json::to_string(&r).unwrap();
        assert!(!json.contains("\"result\""));
        assert!(json.contains("\"error\""));
    }

    #[test]
    fn test_rpc_request_deserialises() {
        let raw = r#"{"id":"abc","method":"ping","params":{}}"#;
        let req: RpcRequest = serde_json::from_str(raw).unwrap();
        assert_eq!(req.id, "abc");
        assert_eq!(req.method, "ping");
    }

    #[test]
    fn test_hybrid_search_params_deserialises() {
        let raw = r#"{"query":"ranged attack","namespace":"core_rules","top_k":5}"#;
        let p: HybridSearchParams = serde_json::from_str(raw).unwrap();
        assert_eq!(p.query, "ranged attack");
        assert_eq!(p.top_k, 5);
    }

    #[test]
    fn test_resolve_attack_params_deserialises() {
        let raw = r#"{"dice":[8],"stat":6,"skill":4,"dv":15}"#;
        let p: ResolveAttackParams = serde_json::from_str(raw).unwrap();
        assert_eq!(p.dice, vec![8]);
        assert_eq!(p.dv, 15);
    }

    #[test]
    fn test_resolve_damage_params_deserialises() {
        let raw = r#"{"dice":[4,3,5],"bonus":2,"armour_sp":7}"#;
        let p: ResolveDamageParams = serde_json::from_str(raw).unwrap();
        assert_eq!(p.dice, vec![4, 3, 5]);
        assert_eq!(p.armour_sp, 7);
    }
}
