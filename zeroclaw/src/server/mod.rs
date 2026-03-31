// zeroclaw/src/server/mod.rs
//
// ClawLink TCP server — listens on 127.0.0.1:{port}.
// Node B connects via SSH directTcpip tunnel; never exposed to the LAN.
//
// Protocol: newline-delimited JSON (one RpcRequest per line → one RpcResponse per line).
// Concurrency: one client at a time (Node B is the only caller).
// Persistence: connection kept alive for the duration of the session.

pub mod handler;
pub mod rpc;

use anyhow::Result;
use rusqlite::Connection;
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::sync::{Arc, Mutex};

/// Start the ClawLink TCP server and block until the process is killed.
///
/// Binds to `127.0.0.1:{port}` — accessible ONLY through the SSH tunnel.
/// Accepts one client at a time; Node B reconnects automatically on drop.
///
/// # Arguments
/// * `conn`  – Shared rules.db connection wrapped in an Arc<Mutex>.
/// * `port`  – TCP port to bind (default: 7878).
pub fn serve(conn: Arc<Mutex<Connection>>, port: u16) -> Result<()> {
    let addr = format!("127.0.0.1:{port}");
    let listener = TcpListener::bind(&addr)?;

    tracing::info!(
        addr = %addr,
        "ClawLink TCP server listening (SSH tunnel only)"
    );

    for stream in listener.incoming() {
        match stream {
            Ok(stream) => {
                let peer = stream.peer_addr().map(|a| a.to_string()).unwrap_or_else(|_| "unknown".into());
                tracing::info!(peer = %peer, "ClawLink client connected");

                let conn = Arc::clone(&conn);
                std::thread::spawn(move || {
                    if let Err(e) = handle_connection(stream, conn) {
                        tracing::warn!(error = %e, peer = %peer, "ClawLink connection error");
                    }
                    tracing::info!(peer = %peer, "ClawLink client disconnected");
                });
            }
            Err(e) => {
                tracing::warn!(error = %e, "Failed to accept TCP connection");
            }
        }
    }

    Ok(())
}

/// Handle a single persistent connection: read lines, dispatch, write responses.
fn handle_connection(stream: std::net::TcpStream, conn: Arc<Mutex<Connection>>) -> Result<()> {
    // Clone the stream for the writer (TcpStream is Clone in Rust std)
    let writer_stream = stream.try_clone()?;
    let reader = BufReader::new(stream);
    let mut writer = std::io::BufWriter::new(writer_stream);

    for line in reader.lines() {
        let line = line?;
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let response = dispatch(trimmed, &conn);

        let mut frame = serde_json::to_string(&response)?;
        frame.push('\n');
        writer.write_all(frame.as_bytes())?;
        writer.flush()?;
    }

    Ok(())
}

/// Parse a raw JSON line into an RpcRequest and route it to the handler.
/// Returns an error response if parsing fails.
fn dispatch(line: &str, conn: &Arc<Mutex<Connection>>) -> rpc::RpcResponse {
    // Parse the request — if malformed, we can't echo the ID so use "unknown"
    let req: rpc::RpcRequest = match serde_json::from_str(line) {
        Ok(r) => r,
        Err(e) => {
            tracing::warn!(error = %e, raw = %&line[..line.len().min(200)], "Malformed RPC frame");
            return rpc::RpcResponse::err("unknown", format!("Malformed JSON-RPC frame: {e}"));
        }
    };

    tracing::debug!(id = %req.id, method = %req.method, "RPC request");

    let db = conn.lock().expect("rules.db mutex poisoned");
    let response = handler::route(&db, req);

    if response.error.is_some() {
        tracing::warn!(id = %response.id, error = ?response.error, "RPC error response");
    }

    response
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::schema;

    fn in_memory_conn() -> Arc<Mutex<Connection>> {
        unsafe {
            rusqlite::ffi::sqlite3_auto_extension(Some(std::mem::transmute(
                sqlite_vec::sqlite3_vec_init as *const (),
            )));
        }
        let conn = Connection::open_in_memory().expect("in-memory db");
        schema::init(&conn).expect("schema init");
        Arc::new(Mutex::new(conn))
    }

    #[test]
    fn test_dispatch_ping() {
        let conn = in_memory_conn();
        let resp = dispatch(r#"{"id":"t1","method":"ping","params":{}}"#, &conn);
        assert!(resp.error.is_none());
        assert_eq!(resp.result.unwrap()["pong"], true);
    }

    #[test]
    fn test_dispatch_malformed_json_returns_error() {
        let conn = in_memory_conn();
        let resp = dispatch("not json at all", &conn);
        assert!(resp.result.is_none());
        assert!(resp.error.unwrap().contains("Malformed JSON-RPC frame"));
    }

    #[test]
    fn test_dispatch_unknown_method_returns_error() {
        let conn = in_memory_conn();
        let resp = dispatch(r#"{"id":"t3","method":"nonexistent","params":{}}"#, &conn);
        assert!(resp.result.is_none());
        assert!(resp.error.is_some());
    }

    #[test]
    fn test_dispatch_resolve_attack_critical_success() {
        let conn = in_memory_conn();
        // Crit chain: 10+8=18, stat=6, skill=4 → total=28 vs DV25 → hit
        let line = r#"{"id":"t4","method":"resolve_attack","params":{"dice":[10,8],"stat":6,"skill":4,"dv":25}}"#;
        let resp = dispatch(line, &conn);
        assert!(resp.error.is_none());
        let r = resp.result.unwrap();
        assert_eq!(r["hit"], true);
        assert_eq!(r["roll"]["is_critical_success"], true);
        assert_eq!(r["roll"]["total"], 18);
    }
}
