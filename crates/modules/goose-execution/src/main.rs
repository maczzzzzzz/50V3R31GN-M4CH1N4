//! Goose Execution Layer - Node B execution.
//!
//! Core design: Fast, simple code execution.
//! - Run scripts via configured backends
//! - Execute shell commands safely
//! - Return results with error handling
use std::process::{Command, exit};
use std::path::PathBuf;
use std::env;
use serde::{Serialize, Deserialize};


/// Execution request
#[derive(Debug, Serialize, Deserialize)]
struct ExecutionRequest {
    script: String,
    language: String,  // python, bash, node, rust, etc.
    cwd: Option<String>,
}

/// Execution response
#[derive(Debug, Serialize, Deserialize)]
struct ExecutionResponse {
    output: String,
    error: Option<String>,
    exit_code: i32,
}

/// Goose execution layer
pub struct Goose {
    cwd: PathBuf,
}

impl Goose {
    /// Create Goose (Node B execution layer)
    pub fn new() -> Self {
        let cwd = env::var("XDG_RUNTIME_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("/tmp/goose"))
            .join("workspaces");

        // Ensure workspace directory exists
        let _ = std::fs::create_dir_all(&cwd);

        log::info!("[Goose] CWD: {}", cwd.display());
        Goose { cwd }
    }

    /// Characters that indicate shell injection attempts
    const DANGEROUS_CHARS: &'static str = "|&;$`><\n\r";

    /// Execute script
    pub fn execute(&mut self, req: ExecutionRequest) -> Result<ExecutionResponse, String> {
        log::info!("[Goose] Executing language: {} ({} chars)", req.language, req.script.len());

        // Validate script for injection patterns
        if req.script.contains(|c: char| Self::DANGEROUS_CHARS.contains(c)) {
            return Err(format!(
                "Script rejected: contains forbidden shell metacharacters. \
                 Sandboxed execution not yet available."
            ));
        }

        let working_dir = req.cwd.as_ref()
            .map(|d| PathBuf::from(d))
            .unwrap_or_else(|| self.cwd.clone());

        // Select executor based on language
        let (cmd, args) = match req.language.as_str() {
            "python" | "py" => ("python3", vec!["-c", &req.script]),
            "bash" | "sh" => ("bash", vec!["-c", &req.script]),
            "node" | "js" => ("node", vec!["-e", &req.script]),
            "rust" | "rs" => {
                return Err(
                    "Rust execution is not supported in single-shot mode. \
                     Use temp file compilation with cargo instead.".to_string()
                );
            }
            _ => return Err(format!("Unsupported language: {}", req.language)),
        };

        let output = Command::new(cmd)
            .args(&args)
            .current_dir(&working_dir)
            .output()
            .map_err(|e| format!("Failed to execute {}: {}", req.language, e))?;

        let exit_code = output.status.code().unwrap_or(-1);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        Ok(ExecutionResponse {
            output: stdout.into(),
            error: if stderr.is_empty() { None } else { Some(stderr.into()) },
            exit_code,
        })
    }
}

fn main() {
    env_logger::init();
    log::info!("[Goose] Initializing Node B execution layer...");

    let mut goose = Goose::new();

    // Test execution
    let test_req = ExecutionRequest {
        script: "print('Hello from Goose!')".to_string(),
        language: "python".to_string(),
        cwd: None,
    };

    match goose.execute(test_req) {
        Ok(response) => {
            log::info!("[Goose] Response: exit_code={}, output_len={}, error={:?}",
                             response.exit_code, response.output.len(), response.error);
        }
        Err(e) => {
            log::error!("[Goose] Test failed: {}", e);
            exit(1);
        }
    }

    log::info!("[Goose] Ready. Node B execution layer active.");
}
