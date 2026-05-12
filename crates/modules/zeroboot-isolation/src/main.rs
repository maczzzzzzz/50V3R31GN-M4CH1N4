//! Zeroboot Isolation - KVM/Firecracker wrapper.
//!
//! Core design: Simple containerized agent workspaces.
//! - KVM-based virtualization (Firecracker microVM)
//! - SCION integration for multi-agent isolation
//! - Fast spawn/teardown (< 2s)
//! - Minimal overhead (512MB base image)
//!

use std::process::{Command, exit};
use std::path::PathBuf;
use std::fs;
use std::env;

/// Configuration for microVM workspace
#[derive(Debug)]
pub struct VMConfig {
    pub id: String,
    pub vcpus: u8,
    pub memory_mb: u64,
    pub workspace_path: PathBuf,
}

impl VMConfig {
    /// Default config for agent workspaces
    pub fn agent_default(id: String) -> Self {
        let workspace_path = env::var("XDG_RUNTIME_DIR")
            .map(|p| PathBuf::from(p))
            .unwrap_or_else(|_| PathBuf::from("/tmp/zeroboot"))
            .join(format!("workspace_{}", id));

        VMConfig {
            id,
            vcpus: 2,
            memory_mb: 2048,
            workspace_path,
        }
    }
}

/// MicroVM runtime
pub struct MicroVM {
    config: VMConfig,
    pid: Option<u32>,
}

impl MicroVM {
    /// Create new microVM
    pub fn new(config: VMConfig) -> Result<Self, String> {
        fs::create_dir_all(&config.workspace_path)
            .map_err(|e| format!("Failed to create workspace: {}", e))?;
        Ok(MicroVM { config, pid: None })
    }

    /// Launch microVM with Firecracker
    pub fn launch(&mut self) -> Result<(), String> {
        if self.pid.is_some() {
            return Err("MicroVM already running".to_string());
        }

        let firecracker = env::var("FIRECRACKER_PATH")
            .unwrap_or_else(|_| "/run/current-system/sw/bin/firecracker".to_string());

        // Use spawn() to get PID without waiting for process to exit
        let child = Command::new(&firecracker)
            .arg("--config-file")
            .arg(self.config.workspace_path.join("config.json"))
            .arg("--level")
            .arg("Info")
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to launch Firecracker: {}", e))?;

        self.pid = Some(child.id());

        // Detach — let Firecracker run independently
        // We track the PID for lifecycle management
        drop(child);

        log::info!("[Zeroboot] MicroVM {} launched (PID: {:?})", self.config.id, self.pid);
        Ok(())
    }

    /// Stop microVM
    pub fn stop(&mut self) -> Result<(), String> {
        if let Some(pid) = self.pid {
            // Use libc::kill instead of spawning kill command
            unsafe {
                let ret = libc::kill(pid as i32, libc::SIGTERM);
                if ret != 0 {
                    return Err(format!("Failed to send SIGTERM to PID {}: errno {}", pid, ret));
                }
            }
            self.pid = None;
            log::info!("[Zeroboot] MicroVM {} stopped", self.config.id);
            Ok(())
        } else {
            Err("MicroVM not running".to_string())
        }
    }

    /// Check if microVM is alive via /proc (zero-fork)
    pub fn is_alive(&self) -> bool {
        self.pid.map_or(false, |pid| {
            let stat_path = format!("/proc/{}/stat", pid);
            std::path::Path::new(&stat_path).exists()
        })
    }
}

/// SCION isolation wrapper
pub struct SCIONIsolation {
    vm: MicroVM,
    scion_path: PathBuf,
}

impl SCIONIsolation {
    /// Create SCION-isolated microVM
    pub fn new(config: VMConfig) -> Result<Self, String> {
        let vm = MicroVM::new(config)?;

        let scion_path = env::var("SCION_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("/run/current-system/sw/bin/scion"));

        Ok(SCIONIsolation { vm, scion_path })
    }

    /// Launch with SCION networking
    pub fn launch(&mut self) -> Result<(), String> {
        self.vm.launch()?;

        // Setup SCION isolation
        let output = Command::new(&self.scion_path)
            .arg("isolate")
            .arg("--vm-id")
            .arg(&self.vm.config.id)
            .output()
            .map_err(|e| format!("Failed to setup SCION: {}", e))?;

        if !output.status.success() {
            return Err(format!("SCION isolation failed: {:?}", String::from_utf8_lossy(&output.stderr)));
        }

        log::info!("[SCION] MicroVM {} isolated with SCION", self.vm.config.id);
        Ok(())
    }
}

fn main() {
    env_logger::init();
    let config = VMConfig::agent_default("test-vm".to_string());

    log::info!("[Zeroboot] Initializing microVM: {:?}", config);

    match SCIONIsolation::new(config) {
        Ok(mut isolation) => {
            if let Err(e) = isolation.launch() {
                log::error!("[Zeroboot] Launch failed: {}", e);
                exit(1);
            }

            log::info!("[Zeroboot] Ready. Press Ctrl+C to stop.");
            loop {
                std::thread::sleep(std::time::Duration::from_secs(5));
                if !isolation.vm.is_alive() {
                    log::info!("[Zeroboot] MicroVM exited");
                    break;
                }
            }
        }
        Err(e) => {
            log::error!("[Zeroboot] Init failed: {}", e);
            exit(1);
        }
    }
}
