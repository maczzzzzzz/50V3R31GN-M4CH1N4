//! MATLAB MCP Bridge - Native Hermes tool.
//!
//! Core design: Simple MATLAB execution via MCP protocol.
//! - Execute MATLAB scripts from Hermes tools
//! - Return results (matrices, plots, data)
//! - Support MATLAB FHS environment (via Nix)
use std::process::{Command, exit};
use std::path::PathBuf;
use std::env;
use serde::{Serialize, Deserialize};


/// MATLAB execution request
#[derive(Debug, Serialize, Deserialize)]
struct MatlabRequest {
    script: String,
    workspace: String,
}

/// MATLAB execution response
#[derive(Debug, Serialize, Deserialize)]
struct MatlabResponse {
    output: String,
    exit_code: i32,
}

/// MATLAB MCP Bridge
pub struct MatlabBridge {
    matlab_path: PathBuf,
}

impl MatlabBridge {
    /// Create bridge (uses Nix-provided MATLAB)
    pub fn new() -> Result<Self, String> {
        let matlab_path = env::var("MATLAB_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("/run/current-system/sw/bin/matlab"));

        log::info!("[MATLAB Bridge] MATLAB path: {}", matlab_path.display());

        Ok(MatlabBridge { matlab_path })
    }

    /// Validate MATLAB script for injection patterns
    pub fn validate_script(&self, script: &str) -> Result<(), String> {
        if script.contains('\'') {
            return Err("Script contains single quotes which are not allowed. \
                        Use double-quoted strings inside MATLAB instead.".to_string());
        }
        if script.contains(|c: char| matches!(c, '|' | '&' | ';' | '$' | '`' | '>' | '<')) {
            return Err("Script contains forbidden shell metacharacters.".to_string());
        }
        Ok(())
    }

    /// Execute MATLAB script
    pub fn execute(&self, req: MatlabRequest) -> Result<MatlabResponse, String> {
        self.validate_script(&req.script)?;

        log::info!("[MATLAB Bridge] Executing: {} (workspace: {})", req.script, req.workspace);

        // Pass script as separate argument (not interpolated into a string)
        let output = Command::new(&self.matlab_path)
            .arg("-batch")
            .arg(&req.script)
            .output()
            .map_err(|e| format!("Failed to execute MATLAB: {}", e))?;

        let exit_code = output.status.code().unwrap_or(-1);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        Ok(MatlabResponse {
            output: if stderr.is_empty() { stdout.into() } else { stderr.into() },
            exit_code,
        })
    }
}

fn main() {
    env_logger::init();
    log::info!("[MATLAB Bridge] Initializing...");

    match MatlabBridge::new() {
        Ok(bridge) => {
            // Test execution
            let test_req = MatlabRequest {
                script: "disp('Hello from MATLAB!')".to_string(),
                workspace: "/tmp/matlab".to_string(),
            };

            match bridge.execute(test_req) {
                Ok(response) => {
                    log::info!("[MATLAB Bridge] Response: exit_code={}, output_len={}",
                             response.exit_code, response.output.len());
                }
                Err(e) => {
                    log::error!("[MATLAB Bridge] Test failed: {}", e);
                    exit(1);
                }
            }
        }
        Err(e) => {
            log::error!("[MATLAB Bridge] Init failed: {}", e);
            exit(1);
        }
    }

    log::info!("[MATLAB Bridge] Ready. MCP server mode not implemented (Hermes tool only).");
}
