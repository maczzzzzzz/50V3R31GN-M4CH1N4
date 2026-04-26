use anyhow::{Context, Result};
use sovereign_vesper_eye::{FailureTracker, LogDistiller, CuriosityEngine};
use std::path::PathBuf;
use std::time::Duration;
use std::{fs, thread};
use tracing::{info, error};

/**
 * VESPER EYE SIDECAR — PHASE 83
 *
 * Background agent that monitors logs for failure streaks and samples 
 * autonomous research goals during idle windows.
 */

fn main() -> Result<()> {
    tracing_subscriber::fmt::init();

    let db_path = PathBuf::from("data/SovereignIntelligence.db");
    let meetings_dir = PathBuf::from("data/meetings");
    fs::create_dir_all(&meetings_dir)?;

    info!("◈ [V3SP3R_EYE] Sidecar igniting — Phase 83 // 50V3R31GN-M4CH1N4");

    let mut tracker = FailureTracker::new(&db_path, &meetings_dir, 3);
    let curiosity = CuriosityEngine::new(&db_path);

    loop {
        // 1. Monitor for failure streaks (Hardgate)
        match tracker.poll() {
            Ok(calls) if calls > 0 => {
                info!("● [FAILURE_TRACKER] {} Hall calls emitted. Hardgate active.", calls);
            }
            Err(e) => error!("!! [FAILURE_TRACKER] Poll failed: {}", e),
            _ => {}
        }

        // 2. Sample and Dispatch Autotelic Goals (Idle Recon)
        if let Ok(Some(goal)) = curiosity.sample_goal() {
            info!("👁️ [AUTOTELIC] Mission Sampled: {} ({}) - {}", 
                goal.target_type, goal.identifier, goal.rationale);
            
            // Dispatch to DB
            if let Ok(conn) = Connection::open(&db_path) {
                let res = conn.execute(
                    "INSERT INTO os_triplets (subject_id, predicate, object_literal, source_id)
                     VALUES (?, 'HAS_ACTIVE_MISSION', ?, 'VESPER_CURIOSITY')",
                    params![goal.identifier, goal.target_type]
                );
                if res.is_ok() {
                    info!("● [MISSION_DISPATCH] Goal shored in relational graph.");
                }
            }
        }

        thread::sleep(Duration::from_secs(30)); // Slower loop for idle recon
    }
}
