/**
 * OPENCLAW CRASH RECOVERY — PHASE 77
 *
 * Supervises agent tasks and auto-restarts them on failure with
 * exponential backoff — preventing tight crash-loop thrashing.
 *
 * Backoff schedule: base_ms * 2^(attempt - 1), capped at max_backoff_ms.
 */

use crate::agent_registry::{AgentHandle, AgentSpec, AgentStatus};
use std::time::Duration;
use tokio::time::sleep;
use tracing::{error, info, warn};

// ── RecoveryError ─────────────────────────────────────────────────────────────

#[derive(Debug)]
pub enum RecoveryError {
    MaxRestartsExceeded { spec_name: String, attempts: u32 },
}

impl std::fmt::Display for RecoveryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RecoveryError::MaxRestartsExceeded { spec_name, attempts } => write!(
                f,
                "CRASH_RECOVERY: '{}' exhausted after {} restart attempts",
                spec_name, attempts
            ),
        }
    }
}

impl std::error::Error for RecoveryError {}

// ── CrashRecovery ─────────────────────────────────────────────────────────────

pub struct CrashRecovery {
    spec:            AgentSpec,
    max_restarts:    u32,
    base_backoff_ms: u64,
    max_backoff_ms:  u64,
}

impl CrashRecovery {
    /// Create a supervised harness.
    ///
    /// * `max_restarts`    — how many times to retry before giving up (0 = no retry)
    /// * `base_backoff_ms` — initial wait on first retry (doubles each attempt)
    pub fn new(spec: AgentSpec, max_restarts: u32, base_backoff_ms: u64) -> Self {
        CrashRecovery {
            spec,
            max_restarts,
            base_backoff_ms,
            max_backoff_ms: 30_000, // hard cap at 30 s
        }
    }

    /// Spawn the agent. If it fails (handle enters Failed state), restart
    /// with exponential backoff until `max_restarts` is exhausted.
    ///
    /// Returns the active handle on the first successful spawn — callers
    /// own it and are responsible for signalling shutdown when done.
    pub async fn run(&self) -> Result<AgentHandle, RecoveryError> {
        let mut attempt = 0u32;
        loop {
            let handle = self.spec.spawn().await;
            if handle.status != AgentStatus::Failed {
                if attempt > 0 {
                    info!(
                        "[CRASH_RECOVERY] '{}' recovered after {} restart(s)",
                        self.spec.name, attempt
                    );
                }
                return Ok(handle);
            }

            attempt += 1;
            if attempt > self.max_restarts {
                error!(
                    "[CRASH_RECOVERY] '{}' failed — max restarts ({}) exceeded",
                    self.spec.name, self.max_restarts
                );
                return Err(RecoveryError::MaxRestartsExceeded {
                    spec_name: self.spec.name.clone(),
                    attempts:  attempt,
                });
            }

            let backoff = self.backoff_for(attempt);
            warn!(
                "[CRASH_RECOVERY] '{}' crashed (attempt {}/{}) — retry in {}ms",
                self.spec.name, attempt, self.max_restarts, backoff
            );
            sleep(Duration::from_millis(backoff)).await;
        }
    }

    /// Supervise a running handle: poll for failure and restart automatically.
    ///
    /// This is a long-running loop — call it in a `tokio::spawn` task.
    /// It will keep restarting the agent until `max_restarts` is exceeded,
    /// at which point it logs the terminal failure and returns.
    pub async fn supervise(&self, mut handle: AgentHandle) {
        let mut restarts = 0u32;
        loop {
            // Yield so the agent task can run before we check its status.
            tokio::task::yield_now().await;

            if handle.status != AgentStatus::Failed {
                // Still healthy — yield and re-check on next tick.
                sleep(Duration::from_millis(100)).await;
                continue;
            }

            restarts += 1;
            if restarts > self.max_restarts {
                error!(
                    "[CRASH_RECOVERY] '{}' supervisor giving up after {} restarts",
                    self.spec.name, restarts
                );
                return;
            }

            let backoff = self.backoff_for(restarts);
            warn!(
                "[CRASH_RECOVERY] '{}' supervisor detected failure (restart {}/{}) — backoff {}ms",
                self.spec.name, restarts, self.max_restarts, backoff
            );
            sleep(Duration::from_millis(backoff)).await;

            handle = self.spec.spawn().await;
            info!("[CRASH_RECOVERY] '{}' restarted (attempt {})", self.spec.name, restarts);
        }
    }

    /// Exponential backoff: base_ms * 2^(n-1), capped at max_backoff_ms.
    fn backoff_for(&self, attempt: u32) -> u64 {
        let exp = self.base_backoff_ms.saturating_mul(1u64 << (attempt - 1).min(30));
        exp.min(self.max_backoff_ms)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agent_registry::AgentSpec;
    use tokio::sync::oneshot;

    fn ok_spec(name: &'static str) -> AgentSpec {
        AgentSpec::new(name, move || async move {
            let (tx, _rx) = oneshot::channel::<()>();
            AgentHandle { name: name.to_string(), status: AgentStatus::Ready, shutdown: tx }
        })
    }

    fn fail_spec(name: &'static str) -> AgentSpec {
        AgentSpec::new(name, move || async move {
            let (tx, _rx) = oneshot::channel::<()>();
            AgentHandle { name: name.to_string(), status: AgentStatus::Failed, shutdown: tx }
        })
    }

    #[tokio::test]
    async fn run_succeeds_on_first_try() {
        let harness = CrashRecovery::new(ok_spec("alpha"), 3, 10);
        let handle = harness.run().await.unwrap();
        assert_ne!(handle.status, AgentStatus::Failed);
    }

    #[tokio::test]
    async fn run_exhausts_and_errors() {
        let harness = CrashRecovery::new(fail_spec("beta"), 2, 1);
        let err = harness.run().await.unwrap_err();
        match err {
            RecoveryError::MaxRestartsExceeded { spec_name, attempts } => {
                assert_eq!(spec_name, "beta");
                assert_eq!(attempts, 3); // 0 initial + 3 retries > max_restarts(2)
            }
        }
    }

    #[test]
    fn backoff_caps_at_max() {
        let harness = CrashRecovery {
            spec:            ok_spec("x"),
            max_restarts:    99,
            base_backoff_ms: 100,
            max_backoff_ms:  5_000,
        };
        assert_eq!(harness.backoff_for(1),  100);
        assert_eq!(harness.backoff_for(2),  200);
        assert_eq!(harness.backoff_for(10), 5_000); // capped
    }
}
