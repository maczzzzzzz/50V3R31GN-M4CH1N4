# mTLS Capability for hermes-router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update `AppState` and `main.rs` to use a `reqwest::Client` configured with `rustls` and SPIRE-issued certificates for zero-trust mTLS.

**Architecture:** Use the `spiffe` crate to connect to the SPIRE Workload API, retrieve X.509 SVIDs and trust bundles, and configure `rustls` to use them. This client will be injected into `AppState` for all outgoing proxy requests.

**Tech Stack:** Rust, reqwest, rustls, spiffe (SPIFFE/SPIRE).

---

### Task 1: Research SPIFFE/rustls Integration

**Files:**
- Research: `crates/hermes-router/src/main.rs`
- Reference: `spiffe` crate documentation/examples

- [ ] **Step 1: Verify SPIRE connection requirements**
Check for `SPIFFE_ENDPOINT_SOCKET` environment variable usage in `spiffe` crate.

### Task 2: Implement create_mtls_client

**Files:**
- Modify: `crates/hermes-router/src/main.rs`

- [ ] **Step 1: Add necessary imports to `main.rs`**

```rust
use spiffe::workload_api::client::WorkloadApiClient;
use spiffe::svid::x509::X509Svid;
use spiffe::bundle::x509::X509Bundle;
use rustls::pki_types::{CertificateDer, PrivateKeyDer};
use std::time::Duration;
```

- [ ] **Step 2: Implement `create_mtls_client` function**

```rust
async fn create_mtls_client() -> anyhow::Result<Client> {
    let socket_path = env::var("SPIFFE_ENDPOINT_SOCKET");
    
    if socket_path.is_err() {
        tracing::warn!("!! [SECURITY] SPIFFE_ENDPOINT_SOCKET not set. Falling back to standard Client.");
        return Ok(Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?);
    }

    info!("◈ [SECURITY] Connecting to SPIRE Workload API...");
    
    // 1. Connect to SPIRE
    let mut client = WorkloadApiClient::default().await?;
    
    // 2. Fetch X509 SVID
    let svid = client.fetch_x509_svid().await?;
    info!("◈ [SECURITY] SVID Fetched: {}", svid.spiffe_id());

    // 3. Fetch X509 Bundle (Trust Anchors)
    let bundle = client.fetch_x509_bundles().await?;

    // 4. Configure rustls
    let cert_chain: Vec<CertificateDer> = svid.cert_chain()
        .iter()
        .map(|c| CertificateDer::from(c.clone()))
        .collect();
    
    let key_der = PrivateKeyDer::try_from(svid.private_key().clone())
        .map_err(|e| anyhow::anyhow!("Failed to parse private key: {}", e))?;

    let mut root_cert_store = rustls::RootCertStore::empty();
    for bundle in bundle {
        for cert in bundle.jwt_authorities() {
             // This needs careful mapping from spiffe bundle to rustls
        }
        // Actually spiffe-rs might have helpers or we need to iterate X509 authorities
    }

    // REFINEMENT: Use a simpler builder if available or direct rustls config
    // ... (will refine in actual implementation)
    
    Ok(Client::builder()
        .use_rustls_tls()
        .build()?)
}
```

### Task 3: Update main() and AppState

**Files:**
- Modify: `crates/hermes-router/src/main.rs`

- [ ] **Step 1: Call `create_mtls_client` in `main()`**

- [ ] **Step 2: Initialize `AppState` with the mTLS client**

### Task 4: Verification

**Files:**
- Run commands

- [ ] **Step 1: Run cargo check**
Run: `cargo check -p hermes-router`
Expected: Success

- [ ] **Step 2: Commit changes**
```bash
git add crates/hermes-router/src/main.rs
git commit -m "feat(hermes-router): implement SPIFFE-based mTLS client"
```
