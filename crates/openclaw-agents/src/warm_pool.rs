/**
 * OPENCLAW WARM POOL — PHASE 77
 *
 * Maintains a pool of pre-spawned agents in READY state, enabling
 * sub-100ms response by eliminating cold-start latency.
 *
 * Flow:
 *   prime()   → spawn `pool_size` agents; all start in Ready
 *   acquire() → pop one Ready handle; async-replenish to keep pool full
 *   status()  → snapshot of Ready / Active counts
 */

use crate::agent_registry::{AgentHandle, AgentSpec, AgentStatus};
use tracing::{debug, warn};

// ── WarmPoolStatus ────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct WarmPoolStatus {
    pub spec_name: String,
    pub ready:     usize,
    pub target:    usize,
}

// ── WarmPool ─────────────────────────────────────────────────────────────────

pub struct WarmPool {
    spec:      AgentSpec,
    pool_size: usize,
    /// Handles currently in READY state.
    ready:     Vec<AgentHandle>,
}

impl WarmPool {
    pub fn new(spec: AgentSpec, pool_size: usize) -> Self {
        WarmPool { spec, pool_size, ready: Vec::with_capacity(pool_size) }
    }

    /// Pre-spawn agents until the pool is full. Call once at startup.
    pub async fn prime(&mut self) {
        let deficit = self.pool_size.saturating_sub(self.ready.len());
        for _ in 0..deficit {
            let mut handle = self.spec.spawn().await;
            handle.status = AgentStatus::Ready;
            self.ready.push(handle);
        }
        debug!("[WARM_POOL] primed: {} ready (target {})", self.ready.len(), self.pool_size);
    }

    /// Acquire a READY agent handle. Spawns a replacement in the background
    /// to keep the pool size constant.
    ///
    /// Returns `None` only if the pool is empty and the spec itself fails —
    /// callers should propagate this to the CrashRecovery harness.
    pub async fn acquire(&mut self) -> Option<AgentHandle> {
        // Drain stale (non-Ready) handles before handing one out.
        self.ready.retain(|h| h.status == AgentStatus::Ready);

        let mut handle = if self.ready.is_empty() {
            warn!("[WARM_POOL] pool dry — cold-spawning '{}'", self.spec.name);
            self.spec.spawn().await
        } else {
            self.ready.remove(0)
        };

        handle.status = AgentStatus::Active;

        // Replenish in the background: spawn replacements to top up.
        let deficit = self.pool_size.saturating_sub(self.ready.len());
        for _ in 0..deficit {
            let mut fresh = self.spec.spawn().await;
            fresh.status = AgentStatus::Ready;
            self.ready.push(fresh);
        }

        debug!(
            "[WARM_POOL] acquired '{}', pool now: {} ready",
            handle.name,
            self.ready.len()
        );
        Some(handle)
    }

    /// Release a completed/failed handle back toward the pool.
    /// Currently discards it and primes a replacement to maintain headroom.
    pub async fn release(&mut self, mut handle: AgentHandle) {
        handle.status = AgentStatus::Completed;
        // Drain handle (shutdown signal dropped naturally).
        drop(handle);
        // Replenish
        if self.ready.len() < self.pool_size {
            let mut fresh = self.spec.spawn().await;
            fresh.status = AgentStatus::Ready;
            self.ready.push(fresh);
        }
    }

    pub fn status(&self) -> WarmPoolStatus {
        WarmPoolStatus {
            spec_name: self.spec.name.clone(),
            ready:     self.ready.iter().filter(|h| h.status == AgentStatus::Ready).count(),
            target:    self.pool_size,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_registry::AgentSpec;
    use tokio::sync::oneshot;

    fn noop_spec(name: &'static str) -> AgentSpec {
        AgentSpec::new(name, move || async move {
            let (tx, _rx) = oneshot::channel::<()>();
            AgentHandle { name: name.to_string(), status: AgentStatus::Ready, shutdown: tx }
        })
    }

    #[tokio::test]
    async fn prime_fills_pool() {
        let mut pool = WarmPool::new(noop_spec("worker"), 3);
        pool.prime().await;
        let s = pool.status();
        assert_eq!(s.ready, 3);
        assert_eq!(s.target, 3);
    }

    #[tokio::test]
    async fn acquire_returns_active_handle() {
        let mut pool = WarmPool::new(noop_spec("worker"), 2);
        pool.prime().await;
        let handle = pool.acquire().await.unwrap();
        assert_eq!(handle.status, AgentStatus::Active);
        // Pool auto-replenishes
        assert_eq!(pool.status().ready, 2);
    }

    #[tokio::test]
    async fn acquire_from_dry_pool_cold_spawns() {
        let mut pool = WarmPool::new(noop_spec("worker"), 0);
        let handle = pool.acquire().await.unwrap();
        assert_eq!(handle.status, AgentStatus::Active);
    }
}
