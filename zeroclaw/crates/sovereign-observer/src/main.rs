/**
 * sovereign-observer/src/main.rs
 *
 * Phase 73.2 — CDP A11y Tree Navigator
 *
 * Replaces xcap screen-capture with raw Chrome DevTools Protocol (CDP) via
 * the Obscura sidecar on localhost:9222.
 *
 * Each tick:
 *   1. GET http://localhost:9222/json  → select first open tab
 *   2. WebSocket connect to tab debugger URL
 *   3. Send Accessibility.enable
 *   4. Send Accessibility.getFullAXTree
 *   5. Annotate nodes with @e1, @e2, ... numbered references
 *   6. Persist to /dev/shm/a11y_tree_latest.json
 *
 * Downstream consumers (HealerProtocol, Node A OCR) read from
 * /dev/shm/a11y_tree_latest.json rather than the old PNG path.
 */

use std::time::Duration;
use anyhow::Context;
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio::time::sleep;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use tracing::{error, info, warn};

const OBSCURA_URL: &str = "http://localhost:9222";
const A11Y_OUTPUT: &str = "/dev/shm/a11y_tree_latest.json";
const TICK_SECS: u64 = 1;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    info!("◈ SOVEREIGN_OBSERVER: Phase 73.2 // CDP_A11Y_ARTERY [Obscura :9222]");

    loop {
        match capture_a11y_tree().await {
            Ok(count) => info!("OBSERVER: A11y tree captured — {count} nodes → {A11Y_OUTPUT}"),
            Err(e) => warn!("OBSERVER: CDP tick failed (will retry): {e}"),
        }
        sleep(Duration::from_secs(TICK_SECS)).await;
    }
}

async fn capture_a11y_tree() -> anyhow::Result<usize> {
    // 1. Fetch tab list from Obscura CDP HTTP endpoint
    let tabs: Vec<Value> = reqwest::get(format!("{OBSCURA_URL}/json"))
        .await
        .context("Obscura unreachable — is obscura-sidecar.service running?")?
        .json()
        .await
        .context("CDP /json response parse error")?;

    let tab = tabs.first().context("No open tabs in Obscura")?;

    let ws_url = tab["webSocketDebuggerUrl"]
        .as_str()
        .context("Tab has no webSocketDebuggerUrl")?;

    // 2. Connect via CDP WebSocket
    let (mut ws, _) = connect_async(ws_url)
        .await
        .context("CDP WebSocket connect failed")?;

    // 3. Enable Accessibility domain
    let enable = json!({"id": 1, "method": "Accessibility.enable", "params": {}});
    ws.send(Message::Text(enable.to_string().into()))
        .await
        .context("Failed to send Accessibility.enable")?;

    // Drain the enable ACK (id:1 result)
    if let Some(msg) = ws.next().await {
        let _ = msg; // ACK only, discard
    }

    // 4. Request full AX tree
    let get_tree = json!({"id": 2, "method": "Accessibility.getFullAXTree", "params": {}});
    ws.send(Message::Text(get_tree.to_string().into()))
        .await
        .context("Failed to send Accessibility.getFullAXTree")?;

    // 5. Read tree response (id:2)
    let node_count = loop {
        match ws.next().await {
            Some(Ok(Message::Text(raw))) => {
                let mut resp: Value =
                    serde_json::from_str(&raw).context("AX tree JSON parse error")?;

                // Only process the response to our request (id:2)
                if resp.get("id").and_then(|v| v.as_u64()) != Some(2) {
                    continue;
                }

                // 6. Annotate nodes with @e1, @e2, ... for A11y tree navigation
                let mut counter: usize = 0;
                if let Some(nodes) = resp["result"]["nodes"].as_array_mut() {
                    for node in nodes.iter_mut() {
                        counter += 1;
                        if let Some(obj) = node.as_object_mut() {
                            obj.insert("ref".to_string(), json!(format!("@e{counter}")));
                        }
                    }
                }

                // 7. Persist annotated tree
                let serialized =
                    serde_json::to_string_pretty(&resp).context("Serialization error")?;
                tokio::fs::write(A11Y_OUTPUT, serialized)
                    .await
                    .context("Failed to write a11y tree to /dev/shm")?;

                break counter;
            }
            Some(Ok(_)) => continue, // binary/ping frames — skip
            Some(Err(e)) => return Err(e.into()),
            None => return Err(anyhow::anyhow!("WebSocket closed before tree response")),
        }
    };

    ws.close(None).await.ok(); // best-effort close

    if node_count == 0 {
        error!("OBSERVER: AX tree returned 0 nodes — page may be empty");
    }

    Ok(node_count)
}
