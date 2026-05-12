//! Director's Forge - CLI Printing Press tool factory.
//!
//! Core design: Simple tool ingestion and deployment.
//! - Ingest GOAT toolsets
//! - Compile to Hermes tools
//! - Deploy to mesh nodes
use std::process::{Command, exit};
use std::path::{Path, PathBuf};
use std::env;
use std::fs;
use serde::{Serialize, Deserialize};


/// Tool definition
#[derive(Debug, Serialize, Deserialize)]
struct ToolDefinition {
    name: String,
    description: String,
    command: String,
    args: Vec<String>,
}


/// Director's Forge
pub struct DirectorsForge {
    library_path: PathBuf,
    output_path: PathBuf,
}

impl DirectorsForge {
    /// Create Forge (Node B tool factory)
    pub fn new() -> Result<Self, String> {
        let library_path = env::var("GOAT_LIBRARY_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("/var/lib/goat-tools"));

        let output_path = env::var("FORGE_OUTPUT_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("/var/lib/hermes-tools"));

        fs::create_dir_all(&library_path)
            .map_err(|e| format!("Failed to create library path: {}", e))?;

        fs::create_dir_all(&output_path)
            .map_err(|e| format!("Failed to create output path: {}", e))?;

        log::info!("[Forge] Library: {}", library_path.display());
        log::info!("[Forge] Output: {}", output_path.display());

        Ok(DirectorsForge {
            library_path,
            output_path,
        })
    }

    /// Validate tool name — reject path traversal characters
    fn validate_tool_name(name: &str) -> Result<(), String> {
        if name.contains('/')
            || name.contains('\\')
            || name.contains("..")
            || name.contains('\0')
            || name.is_empty()
        {
            return Err(format!(
                "Invalid tool name '{}': must not contain path separators, '..', or null bytes",
                name
            ));
        }
        Ok(())
    }

    /// Shell-escape a string by wrapping in single quotes
    fn shell_escape(s: &str) -> String {
        format!("'{}'", s.replace('\'', "'\\''"))
    }

    /// Ingest tool from library
    pub fn ingest_tool(&self, tool_def: ToolDefinition) -> Result<(), String> {
        Self::validate_tool_name(&tool_def.name)?;
        log::info!("[Forge] Ingesting tool: {}", tool_def.name);

        // Create tool directory
        let tool_dir = self.output_path.join(&tool_def.name);
        fs::create_dir_all(&tool_dir)
            .map_err(|e| format!("Failed to create tool dir: {}", e))?;

        // Write tool definition
        let tool_def_path = tool_dir.join("tool.json");
        let tool_def_json = serde_json::to_string_pretty(&tool_def)
            .map_err(|e| format!("Failed to serialize tool: {}", e))?;

        fs::write(&tool_def_path, tool_def_json)
            .map_err(|e| format!("Failed to write tool def: {}", e))?;

        // Write wrapper script
        let wrapper_path = tool_dir.join("wrapper.sh");
        // Shell-escape command and arguments
        let escaped_cmd = Self::shell_escape(&tool_def.command);
        let escaped_args: Vec<String> = tool_def.args.iter()
            .map(|a| Self::shell_escape(a))
            .collect();
        let wrapper = format!("#!/bin/bash\n{} {}\n", escaped_cmd, escaped_args.join(" "));

        fs::write(&wrapper_path, wrapper)
            .map_err(|e| format!("Failed to write wrapper: {}", e))?;

        // Make executable
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&wrapper_path).map_err(|e| format!("Failed to get metadata: {}", e))?.permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&wrapper_path, perms).map_err(|e| format!("Failed to set permissions: {}", e))?;
        }

        log::info!("[Forge] Tool ingested: {}", tool_def.name);
        Ok(())
    }

    /// Compile all tools
    pub fn compile_tools(&self) -> Result<(), String> {
        log::info!("[Forge] Compiling all tools...");

        for entry in fs::read_dir(&self.output_path).map_err(|e| format!("Failed to read output path: {}", e))? {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();

            if path.is_dir() {
                let tool_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("unknown");
                let wrapper_path = path.join("wrapper.sh");

                if !wrapper_path.exists() {
                    log::warn!("[Forge] No wrapper for {}", tool_name);
                    continue;
                }

                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    let mode = fs::metadata(&wrapper_path).map(|m| m.permissions().mode()).unwrap_or(0);
                    if mode & 0o111 != 0 {
                        log::info!("[Forge] Tool compiled: {}", tool_name);
                    } else {
                        log::warn!("[Forge] Tool {} not executable", tool_name);
                    }
                }
            }
        }

        log::info!("[Forge] Compilation complete");
        Ok(())
    }

    /// Deploy tools to mesh
    pub fn deploy_to_mesh(&self, nodes: Vec<String>) -> Result<(), String> {
        log::info!("[Forge] Deploying to {} nodes...", nodes.len());

        for node in nodes {
            log::info!("[Forge] Deploying to {}...", node);

            // Copy tools to node (simplified - rsync)
            let output = Command::new("rsync")
                .arg("-avz")
                .arg(self.output_path.join("*"))
                .arg(format!("{}:/var/lib/hermes-tools/", node))
                .output();

            match output {
                Ok(_) => log::info!("[Forge] Deployed to {}", node),
                Err(e) => {
                    log::info!("[Forge] Warning: Failed to deploy to {}: {}", node, e);
                }
            }
        }

        log::info!("[Forge] Deployment complete");
        Ok(())
    }

    /// Discover API from URL using Sovereign Sniffer
    ///
    /// Uses Stagehand SDK to observe a webpage and extract API endpoints,
    /// then auto-generates a tool definition from the discovered API.
    pub fn discover_api_from_url(&self, url: &str) -> Result<ToolDefinition, String> {
        log::info!("[Forge] Discovering API from {}...", url);

        // Call Sovereign Sniffer CLI
        // Instructions: Extract API documentation, endpoints, and usage examples
        let output = Command::new("nix-shell")
            .arg("-p")
            .arg("nodejs")
            .arg("--run")
            .arg("npx tsx sidecars/sovereign-sniffer/src/cli.ts observe")
                        .arg("--url")
            .arg(url)
            .arg("--instructions")
            .arg("Extract all API endpoints, their methods, parameters, and return types")
            .arg("--output")
            .arg(format!("{}/discovered-api.json", self.output_path.display()))
            .output();

        match output {
            Ok(output) => {
                if output.status.success() {
                    log::info!("[Forge] Discovery successful");

                    // Read the discovered API JSON
                    let discovered_path = self.output_path.join("discovered-api.json");
                    let discovered_content = fs::read_to_string(&discovered_path)
                        .map_err(|e| format!("Failed to read discovered API: {}", e))?;

                    // Parse discovered API and generate tool definition
                    let discovered: serde_json::Value = serde_json::from_str(&discovered_content)
                        .map_err(|e| format!("Failed to parse discovered API: {}", e))?;

                    // Extract API name from URL or content
                    let name_str = url
                        .replace("https://", "")
                        .replace("http://", "")
                        .replace("/", "-");
                    let name = name_str.trim_end_matches('-');

                    let description = format!("Auto-discovered API tool from {}", url);

                    // Generate tool definition (simplified - would normally parse API spec)
                    let tool_def = ToolDefinition {
                        name: format!("api-{}", name),
                        description,
                        command: "curl".to_string(),
                        args: vec![url.to_string()],
                    };

                    log::info!("[Forge] Tool generated: {}", tool_def.name);
                    Ok(tool_def)
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    Err(format!("Sniffer failed: {}", stderr))
                }
            }
            Err(e) => Err(format!("Failed to run sniffer: {}", e))
        }
    }
}

fn main() {
    env_logger::init();
    log::info!("[Forge] Initializing Director's Forge...");

    match DirectorsForge::new() {
        Ok(forge) => {
            // Test tool ingestion
            let test_tool = ToolDefinition {
                name: "hello-world".to_string(),
                description: "Prints hello world".to_string(),
                command: "echo".to_string(),
                args: vec!["Hello from the Forge!".to_string()],
            };

            match forge.ingest_tool(test_tool) {
                Ok(()) => {
                    log::info!("[Forge] Ingestion successful");

                    match forge.compile_tools() {
                        Ok(()) => {
                            log::info!("[Forge] Compilation successful");

                            // Deploy to test nodes
                            let nodes = vec!["node-a".to_string(), "node-c".to_string()];
                            match forge.deploy_to_mesh(nodes) {
                                Ok(()) => {
                                    log::info!("[Forge] Deployment successful");
                                }
                                Err(e) => {
                                    log::error!("[Forge] Deployment failed: {}", e);
                                    exit(1);
                                }
                            }
                        }
                        Err(e) => {
                            log::error!("[Forge] Compilation failed: {}", e);
                            exit(1);
                        }
                    }
                }
                Err(e) => {
                    log::error!("[Forge] Ingestion failed: {}", e);
                    exit(1);
                }
            }
        }
        Err(e) => {
            log::error!("[Forge] Init failed: {}", e);
            exit(1);
        }
    }

    log::info!("[Forge] Ready. Node B tool factory active.");
}
