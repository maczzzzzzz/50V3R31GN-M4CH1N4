use std::time::Duration;
use xcap::Window;
use tokio::time::sleep;
use tracing::{info, error};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    info!("◈ SOVEREIGN_OBSERVER: Phase 64.5 // WSL2_SENSORY_NET");

    loop {
        let windows = Window::all()?;
        let foundry = windows.iter().find(|w| {
            let title = w.title().to_lowercase();
            title.contains("foundry vtt") || title.contains("chromium")
        });

        if let Some(w) = foundry {
            match w.capture_image() {
                Ok(img) => {
                    let path = "/dev/shm/optic_nerve_latest.png";
                    if let Err(e) = img.save(path) {
                        error!("OBSERVER: Failed to save frame: {e}");
                    } else {
                        info!("OBSERVER: Captured Foundry VTT frame → {path}");
                    }
                }
                Err(e) => error!("OBSERVER: Capture failed: {e}"),
            }
        } else {
            error!("OBSERVER: Foundry VTT window not detected. Scanning...");
        }

        sleep(Duration::from_secs(1)).await;
    }
}
