/**
 * OPENCLAW AGENT REGISTRY — PHASE 77
 *
 * Central registry mapping agent names to their spawn specifications.
 * All WarmPool and CrashRecovery instances are built from registered AgentSpecs.
 */

use std::collections::HashMap;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use tokio::sync::oneshot;

// ── AgentStatus ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AgentStatus {
    /// Spawned and running, not yet assigned to a caller.
    Ready,
    /// Assigned to a caller — no longer in the warm pool.
    Active,
    /// Task completed normally.
    Completed,
    /// Task panicked or returned an error; eligible for restart.
    Failed,
}

// ── AgentHandle ──────────────────────────────────────────────────────────────

/// A live agent instance. Holds a shutdown channel and a status signal.
pub struct AgentHandle {
    pub name:    String,
    pub status:  AgentStatus,
    /// Send `()` to request graceful shutdown of the agent task.
    pub shutdown: oneshot::Sender<()>,
}

impl std::fmt::Debug for AgentHandle {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AgentHandle")
            .field("name",   &self.name)
            .field("status", &self.status)
            .finish()
    }
}

// ── AgentSpec ────────────────────────────────────────────────────────────────

/// A factory + metadata descriptor for a managed agent.
///
/// The `spawn_fn` receives a shutdown receiver and must exit cleanly when
/// the receiver fires — enabling graceful warm-pool reclamation.
pub struct AgentSpec {
    pub name: String,
    /// Factory: spawns the agent task and returns an `AgentHandle`.
    pub spawn_fn: Arc<
        dyn Fn() -> Pin<Box<dyn Future<Output = AgentHandle> + Send>> + Send + Sync,
    >,
}

impl AgentSpec {
    /// Convenience constructor.
    pub fn new<F, Fut>(name: impl Into<String>, spawn_fn: F) -> Self
    where
        F:   Fn() -> Fut + Send + Sync + 'static,
        Fut: Future<Output = AgentHandle> + Send + 'static,
    {
        AgentSpec {
            name:     name.into(),
            spawn_fn: Arc::new(move || Box::pin(spawn_fn())),
        }
    }

    /// Invoke the spawn factory.
    pub async fn spawn(&self) -> AgentHandle {
        (self.spawn_fn)().await
    }
}

impl Clone for AgentSpec {
    fn clone(&self) -> Self {
        AgentSpec {
            name:     self.name.clone(),
            spawn_fn: Arc::clone(&self.spawn_fn),
        }
    }
}

// ── AgentRegistry ────────────────────────────────────────────────────────────

/// Global registry of named agent specs.
pub struct AgentRegistry {
    specs: HashMap<String, AgentSpec>,
}

impl AgentRegistry {
    pub fn new() -> Self {
        AgentRegistry { specs: HashMap::new() }
    }

    /// Register a spec under its name. Overwrites on conflict.
    pub fn register(&mut self, spec: AgentSpec) {
        self.specs.insert(spec.name.clone(), spec);
    }

    /// Look up a spec by name.
    pub fn get(&self, name: &str) -> Option<&AgentSpec> {
        self.specs.get(name)
    }

    /// Spawn a fresh agent by name.
    pub async fn spawn(&self, name: &str) -> Option<AgentHandle> {
        self.get(name)?.spawn().await.into()
    }

    pub fn registered_names(&self) -> Vec<&str> {
        self.specs.keys().map(String::as_str).collect()
    }
}

impl Default for AgentRegistry {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::sync::oneshot;

    fn make_spec(name: &'static str) -> AgentSpec {
        AgentSpec::new(name, move || async move {
            let (tx, _rx) = oneshot::channel::<()>();
            AgentHandle { name: name.to_string(), status: AgentStatus::Ready, shutdown: tx }
        })
    }

    #[tokio::test]
    async fn registry_register_and_spawn() {
        let mut reg = AgentRegistry::new();
        reg.register(make_spec("alpha"));
        let handle = reg.spawn("alpha").await.unwrap();
        assert_eq!(handle.name, "alpha");
        assert_eq!(handle.status, AgentStatus::Ready);
    }

    #[tokio::test]
    async fn registry_missing_returns_none() {
        let reg = AgentRegistry::new();
        assert!(reg.spawn("ghost").await.is_none());
    }
}
