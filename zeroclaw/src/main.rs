// zeroclaw/src/main.rs
//
// ZeroClaw — Rules Authority entry point.
// Phase 1: Database initialisation + import subcommand.
// Phase 2: ClawLink persistent SSH server (not yet implemented).
//
// Usage:
//   zeroclaw init   --db rules.db
//   zeroclaw import --db rules.db --file export.zeroclaw.json
//   zeroclaw search --db rules.db --query "DV for ranged attack" --namespace core_rules
//   zeroclaw serve  --db rules.db --port 7878   # Phase 2: ClawLink

use anyhow::Result;
use std::env;
use std::path::PathBuf;

mod cv;
mod db;
#[allow(dead_code)]
mod math;
mod server;

fn main() -> Result<()> {
    // Structured JSON logging to stderr (never stdout — ClawLink uses stdout)
    tracing_subscriber::fmt()
        .json()
        .with_writer(std::io::stderr)
        .init();

    let args: Vec<String> = env::args().collect();
    let subcommand = args.get(1).map(|s| s.as_str()).unwrap_or("help");

    match subcommand {
        "init" => {
            let db_path = parse_flag(&args, "--db").unwrap_or_else(|| "rules.db".to_string());
            tracing::info!(db = %db_path, "Initialising ZeroClaw rules.db");
            let conn = db::open(&PathBuf::from(&db_path))?;
            db::schema::init(&conn)?;
            tracing::info!("Schema initialised successfully");
            println!("OK: rules.db initialised at {db_path}");
        }

        "import" => {
            let db_path = parse_flag(&args, "--db").unwrap_or_else(|| "rules.db".to_string());
            let file_path = parse_flag(&args, "--file")
                .ok_or_else(|| anyhow::anyhow!("--file <path> is required for import"))?;

            tracing::info!(db = %db_path, file = %file_path, "Starting ZeroClaw import");
            let conn = db::open(&PathBuf::from(&db_path))?;
            db::schema::init(&conn)?;
            let count = db::import::run(&conn, &PathBuf::from(&file_path))?;
            tracing::info!(count, "Import complete");
            println!("OK: imported {count} chunks");
        }

        "search" => {
            let db_path = parse_flag(&args, "--db").unwrap_or_else(|| "rules.db".to_string());
            let query = parse_flag(&args, "--query")
                .ok_or_else(|| anyhow::anyhow!("--query <text> is required for search"))?;
            let namespace = parse_flag(&args, "--namespace")
                .unwrap_or_else(|| "core_rules".to_string());

            let conn = db::open(&PathBuf::from(&db_path))?;
            let results = db::search::hybrid_search(&conn, &query, &namespace, 5)?;
            println!("{}", serde_json::to_string_pretty(&results)?);
        }

        "serve" => {
            let db_path = parse_flag(&args, "--db").unwrap_or_else(|| "rules.db".to_string());
            let port: u16 = parse_flag(&args, "--port")
                .unwrap_or_else(|| "7878".to_string())
                .parse()
                .map_err(|_| anyhow::anyhow!("--port must be a valid port number (1-65535)"))?;

            tracing::info!(db = %db_path, port, "Starting ClawLink TCP server");
            let conn = db::open(&PathBuf::from(&db_path))?;
            db::schema::init(&conn)?;

            let conn = std::sync::Arc::new(std::sync::Mutex::new(conn));
            server::serve(conn, port)?;
        }

        // Phase 6: Project Eyes-On — Geometric Wall Engine
        "cv" => {
            let input_path = parse_flag(&args, "--input")
                .ok_or_else(|| anyhow::anyhow!("--input <path> is required for cv"))?;
            let padding: f64 = parse_flag(&args, "--padding")
                .unwrap_or_else(|| "0.05".to_string())
                .parse()
                .map_err(|_| anyhow::anyhow!("--padding must be a valid float (e.g. 0.05)"))?;

            tracing::info!(input = %input_path, padding, "Starting Eyes-On wall detection");
            let image_bytes = std::fs::read(&input_path)?;
            let walls = cv::detect_walls(&image_bytes, padding)?;
            let json = cv::walls_to_foundry_json(&walls);
            println!("{}", serde_json::to_string_pretty(&json)?);
        }

        "help" | "--help" | "-h" => {
            eprintln!("ZeroClaw — Rules Authority (Project Black-Ice v0.9.0)");
            eprintln!();
            eprintln!("USAGE:");
            eprintln!("  zeroclaw init   --db <path>");
            eprintln!("  zeroclaw import --db <path> --file <export.zeroclaw.json>");
            eprintln!("  zeroclaw search --db <path> --query <text> [--namespace <ns>]");
            eprintln!("  zeroclaw serve  --db <path> [--port <n>]  (ClawLink SSH bridge)");
            eprintln!("  zeroclaw cv     --input <map.png> [--padding <f64>]  (Phase 6: Eyes-On)");
        }

        other => {
            anyhow::bail!("Unknown subcommand '{other}'. Run 'zeroclaw help' for usage.");
        }
    }

    Ok(())
}

fn parse_flag(args: &[String], flag: &str) -> Option<String> {
    args.windows(2)
        .find(|w| w[0] == flag)
        .map(|w| w[1].clone())
}
