//! vitals.rs — Kernel telemetry reader via /proc
//!
//! Reads CPU, memory and IO pressure from the Linux /proc VFS.
//! Works on WSL2 and bare-metal Linux.
//!
//! eBPF path (bare-metal only): swap the /proc readers for libbpf-rs
//! BPF_PROG_TYPE_PERF_EVENT probes when the kernel supports them.

use anyhow::Result;
use serde::Serialize;
use std::{fs, time::{SystemTime, UNIX_EPOCH}};

// ── Snapshot types ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct CpuStats {
    pub user_pct:   f32,
    pub system_pct: f32,
    pub idle_pct:   f32,
    pub iowait_pct: f32,
}

#[derive(Debug, Clone, Serialize)]
pub struct MemStats {
    pub total_mb:     u64,
    pub available_mb: u64,
    pub used_mb:      u64,
    pub used_pct:     f32,
}

#[derive(Debug, Clone, Serialize)]
pub struct IoStats {
    /// Pressure stall information — available on kernels with PSI (≥4.20).
    /// None on WSL2 / older kernels.
    pub cpu_pressure_pct:  Option<f32>,
    pub mem_pressure_pct:  Option<f32>,
    pub io_pressure_pct:   Option<f32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct VitalsSnapshot {
    pub timestamp_ms: u64,
    pub cpu:          CpuStats,
    pub mem:          MemStats,
    pub io:           IoStats,
}

// ── CPU reader ────────────────────────────────────────────────────────────────

/// Reads two /proc/stat samples separated by `interval_ms` and computes usage %.
pub async fn read_cpu(interval_ms: u64) -> Result<CpuStats> {
    let a = parse_proc_stat_cpu()?;
    tokio::time::sleep(std::time::Duration::from_millis(interval_ms)).await;
    let b = parse_proc_stat_cpu()?;

    let total_a = a.iter().sum::<u64>();
    let total_b = b.iter().sum::<u64>();
    let total   = (total_b - total_a).max(1) as f32;

    // /proc/stat order: user nice system idle iowait irq softirq steal …
    let user_pct   = (b[0].saturating_sub(a[0]) + b[1].saturating_sub(a[1])) as f32 / total * 100.0;
    let system_pct = b[2].saturating_sub(a[2]) as f32 / total * 100.0;
    let idle_pct   = b[3].saturating_sub(a[3]) as f32 / total * 100.0;
    let iowait_pct = b[4].saturating_sub(a[4]) as f32 / total * 100.0;

    Ok(CpuStats { user_pct, system_pct, idle_pct, iowait_pct })
}

fn parse_proc_stat_cpu() -> Result<Vec<u64>> {
    let raw = fs::read_to_string("/proc/stat")?;
    let cpu_line = raw.lines()
        .find(|l| l.starts_with("cpu "))
        .ok_or_else(|| anyhow::anyhow!("no cpu line in /proc/stat"))?;
    let nums: Vec<u64> = cpu_line
        .split_whitespace()
        .skip(1)           // skip "cpu" label
        .take(8)
        .filter_map(|s| s.parse().ok())
        .collect();
    Ok(nums)
}

// ── Memory reader ─────────────────────────────────────────────────────────────

pub fn read_mem() -> Result<MemStats> {
    let raw = fs::read_to_string("/proc/meminfo")?;
    let mut total_kb     = 0u64;
    let mut available_kb = 0u64;

    for line in raw.lines() {
        let mut parts = line.split_whitespace();
        match parts.next() {
            Some("MemTotal:")     => { total_kb     = parts.next().and_then(|v| v.parse().ok()).unwrap_or(0); }
            Some("MemAvailable:") => { available_kb = parts.next().and_then(|v| v.parse().ok()).unwrap_or(0); }
            _ => {}
        }
    }

    let used_kb  = total_kb.saturating_sub(available_kb);
    let used_pct = if total_kb > 0 { used_kb as f32 / total_kb as f32 * 100.0 } else { 0.0 };

    Ok(MemStats {
        total_mb:     total_kb / 1024,
        available_mb: available_kb / 1024,
        used_mb:      used_kb / 1024,
        used_pct,
    })
}

// ── IO/PSI pressure reader ────────────────────────────────────────────────────

pub fn read_io() -> Result<IoStats> {
    Ok(IoStats {
        cpu_pressure_pct: read_psi("/proc/pressure/cpu",  "some"),
        mem_pressure_pct: read_psi("/proc/pressure/memory","some"),
        io_pressure_pct:  read_psi("/proc/pressure/io",   "some"),
    })
}

/// Parses avg10 (10-second stall %) from a PSI file.
/// Returns None if the file is unavailable (WSL2 / old kernel).
fn read_psi(path: &str, mode: &str) -> Option<f32> {
    let raw = fs::read_to_string(path).ok()?;
    for line in raw.lines() {
        if line.starts_with(mode) {
            for field in line.split_whitespace() {
                if let Some(val) = field.strip_prefix("avg10=") {
                    return val.parse().ok();
                }
            }
        }
    }
    None
}

// ── Full snapshot ─────────────────────────────────────────────────────────────

pub async fn snapshot(cpu_interval_ms: u64) -> Result<VitalsSnapshot> {
    let (cpu, mem, io) = tokio::join!(
        read_cpu(cpu_interval_ms),
        async { read_mem() },
        async { read_io() },
    );
    let ts = SystemTime::now().duration_since(UNIX_EPOCH)?.as_millis() as u64;
    Ok(VitalsSnapshot { timestamp_ms: ts, cpu: cpu?, mem: mem?, io: io? })
}
