//! Graphify AST - Spatial memory on Nodes C/D.
//!
//! Core design: Simple AST parsing and spatial indexing.
//! - Parse code ASTs (Python, Rust, JS)
//! - Index nodes by type, scope, relationships
//! - Query by pattern, scope, or code path
use std::collections::HashMap;
use std::path::Path;
use std::process::exit;
use serde::{Serialize, Deserialize};


/// Code node in AST
#[derive(Debug, Clone, Serialize, Deserialize)]
struct ASTNode {
    id: String,
    node_type: String,  // function, class, variable, import, etc.
    name: String,
    scope: String,
    file_path: String,
    line: u32,
    children: Vec<String>,  // Child node IDs
}

/// Spatial index for code nodes
pub struct Graphify {
    nodes: HashMap<String, ASTNode>,
    scope_index: HashMap<String, Vec<String>>,  // scope -> node IDs
}

impl Graphify {
    /// Create Graphify spatial index
    pub fn new() -> Self {
        log::info!("[Graphify] Initializing AST spatial index...");

        Graphify {
            nodes: HashMap::new(),
            scope_index: HashMap::new(),
        }
    }

    /// Parse code file (simplified - placeholder)
    pub fn parse_file(&mut self, file_path: &str, code: &str) -> Result<(), String> {
        log::info!("[Graphify] Parsing: {}", file_path);

        // Simplified AST parsing (extract functions)
        // Real implementation: Use tree-sitter or proper AST parser
        for (line_num, line) in code.lines().enumerate() {
            if line.starts_with("def ") || line.starts_with("fn ") {
                let name = line.split_whitespace()
                    .nth(1)
                    .unwrap_or("anonymous")
                    .replace("(", "")
                    .replace("{", "");

                let node = ASTNode {
                    id: format!("{}:{}", file_path, line_num),
                    node_type: "function".to_string(),
                    name,
                    scope: "global".to_string(),
                    file_path: file_path.to_string(),
                    line: line_num as u32,
                    children: vec![],
                };

                self.add_node(node);
            }
        }

        Ok(())
    }

    /// Add node to index
    fn add_node(&mut self, node: ASTNode) {
        let id = node.id.clone();
        let scope = node.scope.clone();

        self.nodes.insert(id.clone(), node);

        self.scope_index
            .entry(scope)
            .or_insert_with(Vec::new)
            .push(id);
    }

    /// Query nodes by type
    pub fn query_by_type(&self, node_type: &str) -> Vec<ASTNode> {
        self.nodes
            .values()
            .filter(|n| n.node_type == node_type)
            .cloned()
            .collect()
    }

    /// Query nodes by scope
    pub fn query_by_scope(&self, scope: &str) -> Vec<ASTNode> {
        self.scope_index
            .get(scope)
            .map(|ids| ids.iter().filter_map(|id| self.nodes.get(id).cloned()).collect())
            .unwrap_or_default()
    }

    /// Get node by ID
    pub fn get_node(&self, id: &str) -> Option<ASTNode> {
        self.nodes.get(id).cloned()
    }
}

fn main() {
    env_logger::init();
    log::info!("[Graphify] Initializing...");

    let mut graphify = Graphify::new();

    // Test parsing
    let test_code = r#"
def test_function():
    return 42

def another_function():
    return "hello"
"#;

    match graphify.parse_file("test.py", test_code) {
        Ok(()) => {
            log::info!("[Graphify] Parsed {} nodes", graphify.nodes.len());

            let functions = graphify.query_by_type("function");
            log::info!("[Graphify] Found {} functions", functions.len());

            for func in &functions {
                log::info!("[Graphify]   - {} (line {})", func.name, func.line);
            }
        }
        Err(e) => {
            log::error!("[Graphify] Parse failed: {}", e);
            exit(1);
        }
    }

    log::info!("[Graphify] Ready. Nodes C/D AST spatial index active.");
}
