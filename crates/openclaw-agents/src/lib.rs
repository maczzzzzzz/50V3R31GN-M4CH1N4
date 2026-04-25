/**
 * OPENCLAW MANAGED AGENTS — PHASE 77
 *
 * High-resilience agent primitives for the Sovereign Intelligence OS.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │  AgentRegistry   — name → AgentSpec directory           │
 * │  WarmPool        — pre-spawned standby (sub-100ms acq.) │
 * │  CrashRecovery   — supervised restart with exp. backoff  │
 * └──────────────────────────────────────────────────────────┘
 */

pub mod agent_registry;
pub mod crash_recovery;
pub mod warm_pool;

pub use agent_registry::{AgentHandle, AgentRegistry, AgentSpec, AgentStatus};
pub use crash_recovery::{CrashRecovery, RecoveryError};
pub use warm_pool::{WarmPool, WarmPoolStatus};
