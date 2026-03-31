// zeroclaw/src/server/handler.rs
//
// Routes inbound RPC requests to the appropriate ZeroClaw subsystem.
// All database access is through a locked rusqlite Connection.
// All math is pure — no side effects.

use super::rpc::{
    HybridSearchParams, ResolveDamageParams, ResolveAttackParams, RpcRequest, RpcResponse,
};
use crate::db::search;
use crate::math::interlock;
use rusqlite::Connection;

/// Route an RPC request to the correct handler and return a response.
/// Never panics — all errors are caught and returned as `RpcResponse::err`.
pub fn route(conn: &Connection, req: RpcRequest) -> RpcResponse {
    match req.method.as_str() {
        "ping" => RpcResponse::ok(req.id, serde_json::json!({ "pong": true })),

        "hybrid_search" => handle_hybrid_search(conn, req),

        "resolve_attack" => handle_resolve_attack(req),

        "resolve_damage" => handle_resolve_damage(req),

        other => RpcResponse::err(
            req.id,
            format!("Unknown method: '{other}'. Valid methods: ping, hybrid_search, resolve_attack, resolve_damage"),
        ),
    }
}

// ── hybrid_search ─────────────────────────────────────────────────────────────

fn handle_hybrid_search(conn: &Connection, req: RpcRequest) -> RpcResponse {
    let params: HybridSearchParams = match serde_json::from_value(req.params) {
        Ok(p) => p,
        Err(e) => return RpcResponse::err(req.id, format!("hybrid_search: invalid params — {e}")),
    };

    if params.query.trim().is_empty() {
        return RpcResponse::err(req.id, "hybrid_search: query must not be empty");
    }

    match search::hybrid_search(conn, &params.query, &params.namespace, params.top_k) {
        Ok(results) => match serde_json::to_value(results) {
            Ok(v) => RpcResponse::ok(req.id, v),
            Err(e) => RpcResponse::err(req.id, format!("hybrid_search: serialisation error — {e}")),
        },
        Err(e) => RpcResponse::err(req.id, format!("hybrid_search: query error — {e}")),
    }
}

// ── resolve_attack ────────────────────────────────────────────────────────────

fn handle_resolve_attack(req: RpcRequest) -> RpcResponse {
    let params: ResolveAttackParams = match serde_json::from_value(req.params) {
        Ok(p) => p,
        Err(e) => return RpcResponse::err(req.id, format!("resolve_attack: invalid params — {e}")),
    };

    if params.dice.is_empty() {
        return RpcResponse::err(req.id, "resolve_attack: dice must not be empty");
    }

    let roll = interlock::resolve_roll(&params.dice);
    let result = interlock::resolve_attack(roll, params.stat, params.skill, params.dv);

    match serde_json::to_value(result) {
        Ok(v) => RpcResponse::ok(req.id, v),
        Err(e) => RpcResponse::err(req.id, format!("resolve_attack: serialisation error — {e}")),
    }
}

// ── resolve_damage ────────────────────────────────────────────────────────────

fn handle_resolve_damage(req: RpcRequest) -> RpcResponse {
    let params: ResolveDamageParams = match serde_json::from_value(req.params) {
        Ok(p) => p,
        Err(e) => return RpcResponse::err(req.id, format!("resolve_damage: invalid params — {e}")),
    };

    if params.dice.is_empty() {
        return RpcResponse::err(req.id, "resolve_damage: dice must not be empty");
    }

    let result = interlock::resolve_damage(&params.dice, params.bonus, params.armour_sp);

    match serde_json::to_value(result) {
        Ok(v) => RpcResponse::ok(req.id, v),
        Err(e) => RpcResponse::err(req.id, format!("resolve_damage: serialisation error — {e}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::schema;
    use rusqlite::Connection;

    fn in_memory_conn() -> Connection {
        unsafe {
            rusqlite::ffi::sqlite3_auto_extension(Some(std::mem::transmute(
                sqlite_vec::sqlite3_vec_init as *const (),
            )));
        }
        let conn = Connection::open_in_memory().expect("in-memory db");
        schema::init(&conn).expect("schema init");
        conn
    }

    fn make_req(id: &str, method: &str, params: serde_json::Value) -> RpcRequest {
        RpcRequest { id: id.to_string(), method: method.to_string(), params }
    }

    #[test]
    fn test_ping_returns_pong() {
        let conn = in_memory_conn();
        let resp = route(&conn, make_req("1", "ping", serde_json::json!({})));
        assert!(resp.error.is_none());
        let result = resp.result.unwrap();
        assert_eq!(result["pong"], true);
    }

    #[test]
    fn test_unknown_method_returns_error() {
        let conn = in_memory_conn();
        let resp = route(&conn, make_req("2", "fly_to_moon", serde_json::json!({})));
        assert!(resp.result.is_none());
        assert!(resp.error.unwrap().contains("Unknown method"));
    }

    #[test]
    fn test_resolve_attack_hit() {
        let conn = in_memory_conn();
        // roll=8, stat=6, skill=4 → total=18 vs DV15 → hit
        let params = serde_json::json!({ "dice": [8], "stat": 6, "skill": 4, "dv": 15 });
        let resp = route(&conn, make_req("3", "resolve_attack", params));
        assert!(resp.error.is_none());
        let r = resp.result.unwrap();
        assert_eq!(r["hit"], true);
        assert_eq!(r["attack_total"], 18);
    }

    #[test]
    fn test_resolve_attack_miss() {
        let conn = in_memory_conn();
        // roll=2, stat=3, skill=2 → total=7 vs DV15 → miss
        let params = serde_json::json!({ "dice": [2], "stat": 3, "skill": 2, "dv": 15 });
        let resp = route(&conn, make_req("4", "resolve_attack", params));
        assert!(resp.error.is_none());
        assert_eq!(resp.result.unwrap()["hit"], false);
    }

    #[test]
    fn test_resolve_attack_empty_dice_returns_error() {
        let conn = in_memory_conn();
        let params = serde_json::json!({ "dice": [], "stat": 6, "skill": 4, "dv": 15 });
        let resp = route(&conn, make_req("5", "resolve_attack", params));
        assert!(resp.result.is_none());
        assert!(resp.error.unwrap().contains("dice must not be empty"));
    }

    #[test]
    fn test_resolve_damage_applies_armour() {
        let conn = in_memory_conn();
        // [4,3,5]=12 +2 bonus, SP=7 → final=7
        let params = serde_json::json!({ "dice": [4,3,5], "bonus": 2, "armour_sp": 7 });
        let resp = route(&conn, make_req("6", "resolve_damage", params));
        assert!(resp.error.is_none());
        let r = resp.result.unwrap();
        assert_eq!(r["final_damage"], 7);
        assert_eq!(r["raw"], 14);
    }

    #[test]
    fn test_resolve_damage_clamped_to_zero() {
        let conn = in_memory_conn();
        let params = serde_json::json!({ "dice": [1,1], "bonus": 0, "armour_sp": 20 });
        let resp = route(&conn, make_req("7", "resolve_damage", params));
        assert_eq!(resp.result.unwrap()["final_damage"], 0);
    }

    #[test]
    fn test_hybrid_search_empty_query_returns_error() {
        let conn = in_memory_conn();
        let params = serde_json::json!({ "query": "  ", "namespace": "core_rules", "top_k": 5 });
        let resp = route(&conn, make_req("8", "hybrid_search", params));
        assert!(resp.result.is_none());
        assert!(resp.error.unwrap().contains("query must not be empty"));
    }
}
