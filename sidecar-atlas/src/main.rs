use eframe::egui;
use egui::{epaint, CentralPanel, Color32, FontId, Pos2, Stroke};
use memmap2::{Mmap, MmapMut, MmapOptions};
use sovereign_sdk::protocol::{
    GhostBlip as GhostBlipProtocol, GHOST_BLIP_SIZE, GHOST_HEADER_SIZE, GHOST_MAGIC, RADAR_BLIP_SIZE,
    RADAR_HEADER_SIZE, RADAR_MAGIC,
};
use std::fs::{File, OpenOptions};
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

// ─── Black-Ice Palette ───────────────────────────────────────────────────────
const RED: Color32 = Color32::from_rgb(0xff, 0x00, 0x3c);
const GREEN: Color32 = Color32::from_rgb(0x20, 0xff, 0x60);

// ─── GhostBlip type constants ─────────────────────────────────────────────────
const BLIP_COVER: u8 = 0x01;
const BLIP_HAZARD: u8 = 0x02;
const BLIP_OBJECTIVE: u8 = 0x03;

// ─── Structs ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
struct RadarBlip {
    id: String,
    name: String,
    x: f32,
    y: f32,
    hp: i32,
    actor_type: u8,
    faction: String,
}

/// Local copy of the GhostBlip protocol struct for UI use.
#[derive(Debug, Clone, Copy)]
struct GhostBlip {
    pub x: f32,         // Normalised X coordinate [0.0–1.0]
    pub y: f32,         // Normalised Y coordinate [0.0–1.0]
    pub blip_type: u8,  // 0x01=cover, 0x02=hazard, 0x03=objective
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

fn parse_null_str(bytes: &[u8]) -> String {
    let end = bytes.iter().position(|&b| b == 0).unwrap_or(bytes.len());
    String::from_utf8_lossy(&bytes[..end]).into_owned()
}

/// Parse a ghost blip mmap buffer into a `Vec<GhostBlip>`.
/// Returns an empty Vec if magic is wrong or the buffer is too short.
fn parse_ghost_blips(data: &[u8]) -> Vec<GhostBlip> {
    // Validate header length
    if data.len() < GHOST_HEADER_SIZE {
        return Vec::new();
    }
    // Validate magic
    if &data[0..16] != GHOST_MAGIC {
        return Vec::new();
    }
    const MAX_GHOST_BLIPS: usize = 1024;
    let ghost_count = (u32::from_le_bytes(data[16..20].try_into().unwrap_or([0; 4])) as usize)
        .min(MAX_GHOST_BLIPS);

    let mut blips = Vec::with_capacity(ghost_count);
    for i in 0..ghost_count {
        let base = GHOST_HEADER_SIZE + i * GHOST_BLIP_SIZE;
        if data.len() < base + GHOST_BLIP_SIZE {
            break;
        }
        let entry = &data[base..base + 9];
        let gb = GhostBlipProtocol::decode(entry.try_into().unwrap());
        blips.push(GhostBlip {
            x: gb.x,
            y: gb.y,
            blip_type: gb.blip_type,
        });
    }
    blips
}

// ─── App ──────────────────────────────────────────────────────────────────────

struct AtlasApp {
    #[allow(dead_code)]
    file: Option<File>,
    mmap: Option<Mmap>,
    blips: Vec<RadarBlip>,
    transaction_counter: u32,
    last_error: Option<String>,

    // Ghost blip state
    #[allow(dead_code)]
    ghost_file: Option<File>,
    ghost_mmap: Option<Mmap>,
    ghost_blips: Vec<GhostBlip>,
    ghost_path: PathBuf,
}

impl AtlasApp {
    fn new(mem_path: PathBuf) -> Self {
        // Derive ghost path: <radar_path>.ghost
        let ghost_path = {
            let mut p = mem_path.clone().into_os_string();
            p.push(".ghost");
            PathBuf::from(p)
        };

        let mut app = Self {
            file: None,
            mmap: None,
            blips: Vec::new(),
            transaction_counter: 0,
            last_error: None,
            ghost_file: None,
            ghost_mmap: None,
            ghost_blips: Vec::new(),
            ghost_path,
        };

        // Map the radar file
        match File::open(&mem_path) {
            Ok(file) => {
                // SAFETY: `file` is stored in `self.file` alongside the `Mmap`, so the
                // underlying file descriptor remains open for the lifetime of the mapping,
                // preventing use-after-free of the mapping.  SIGBUS risk: if the backing
                // file is truncated or replaced by an external process while mapped, a read
                // can produce SIGBUS.  Mitigated by the fixed-layout protocol; Node A only
                // appends/overwrites atomically and never shrinks the file.
                match unsafe { Mmap::map(&file) } {
                    Ok(mmap) => {
                        app.mmap = Some(mmap);
                        app.file = Some(file);
                    }
                    Err(e) => app.last_error = Some(format!("mmap error: {}", e)),
                }
            }
            Err(e) => app.last_error = Some(format!("Waiting for Node B... ({})", e)),
        }

        // Attempt to map the ghost file (optional — may not exist yet)
        app.try_open_ghost();

        app
    }

    /// Try to open / re-open the ghost mmap.  Silently no-ops if absent.
    fn try_open_ghost(&mut self) {
        if self.ghost_mmap.is_some() {
            return;
        }
        if let Ok(file) = File::open(&self.ghost_path) {
            // SAFETY: `file` is stored in `self.ghost_file` alongside the `Mmap`, so the
            // underlying file descriptor remains open for the lifetime of the mapping,
            // preventing use-after-free of the mapping.  SIGBUS risk: if the backing file
            // is truncated or replaced by an external process while mapped, a read can
            // produce SIGBUS.  Mitigated by the fixed-layout protocol; Node A only
            // appends/overwrites atomically and never shrinks the file.
            if let Ok(mmap) = unsafe { Mmap::map(&file) } {
                self.ghost_mmap = Some(mmap);
                self.ghost_file = Some(file);
            }
        }
    }

    fn parse_state(&mut self) {
        let mmap = match &self.mmap {
            Some(m) => m,
            None => return,
        };

        let data = &mmap[..];
        if data.len() < RADAR_HEADER_SIZE || &data[0..16] != RADAR_MAGIC {
            self.last_error = Some("Invalid or truncated .mem file".to_string());
            return;
        }

        self.transaction_counter = u32::from_le_bytes(data[16..20].try_into().unwrap_or([0; 4]));
        let blip_count = u32::from_le_bytes(data[20..24].try_into().unwrap_or([0; 4])) as usize;

        let mut blips = Vec::with_capacity(blip_count);
        for i in 0..blip_count {
            let base = RADAR_HEADER_SIZE + i * RADAR_BLIP_SIZE;
            if data.len() < base + RADAR_BLIP_SIZE {
                break;
            }
            let blip_data = &data[base..base + RADAR_BLIP_SIZE];
            blips.push(RadarBlip {
                id: parse_null_str(&blip_data[0..16]),
                name: parse_null_str(&blip_data[16..32]),
                x: f32::from_le_bytes(blip_data[32..36].try_into().unwrap_or([0; 4])),
                y: f32::from_le_bytes(blip_data[36..40].try_into().unwrap_or([0; 4])),
                hp: i32::from_le_bytes(blip_data[40..44].try_into().unwrap_or([0; 4])),
                actor_type: blip_data[44],
                faction: parse_null_str(&blip_data[48..64]),
            });
        }
        self.blips = blips;
        self.last_error = None;
    }

    /// Read the ghost mmap and re-parse all GhostBlips.
    fn parse_ghost_state(&mut self) {
        // Lazily try to open if not yet mapped
        self.try_open_ghost();

        self.ghost_blips = match &self.ghost_mmap {
            Some(mmap) => parse_ghost_blips(&mmap[..]),
            None => Vec::new(),
        };
    }
}

// ─── eframe::App ──────────────────────────────────────────────────────────────

impl eframe::App for AtlasApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.parse_state();
        self.parse_ghost_state();

        let mut visuals = ctx.style().visuals.clone();

        // Backgrounds
        visuals.panel_fill           = Color32::from_rgb(5, 5, 5);
        visuals.window_fill          = Color32::BLACK;
        visuals.extreme_bg_color     = Color32::BLACK;
        visuals.faint_bg_color       = Color32::from_rgb(5, 5, 5);
        visuals.code_bg_color        = Color32::from_rgb(5, 5, 5);

        // Window chrome
        visuals.window_stroke        = Stroke::new(1.0, RED);
        visuals.window_shadow        = epaint::Shadow::NONE;
        visuals.popup_shadow         = epaint::Shadow::NONE;

        // Text
        visuals.override_text_color  = Some(Color32::from_rgb(238, 238, 238));

        // Widgets — noninteractive
        visuals.widgets.noninteractive.bg_fill      = Color32::from_rgb(5, 5, 5);
        visuals.widgets.noninteractive.weak_bg_fill = Color32::BLACK;
        visuals.widgets.noninteractive.bg_stroke    = Stroke::new(1.0, Color32::from_rgb(34, 34, 34));
        visuals.widgets.noninteractive.fg_stroke    = Stroke::new(1.0, RED);

        // Widgets — inactive
        visuals.widgets.inactive.bg_fill            = Color32::from_rgb(5, 5, 5);
        visuals.widgets.inactive.weak_bg_fill       = Color32::BLACK;
        visuals.widgets.inactive.fg_stroke          = Stroke::new(1.0, Color32::from_rgb(136, 136, 136));

        // Widgets — hovered
        visuals.widgets.hovered.bg_fill             = Color32::from_rgb(26, 26, 26);
        visuals.widgets.hovered.fg_stroke           = Stroke::new(1.5, RED);
        visuals.widgets.hovered.bg_stroke           = Stroke::new(1.0, RED);

        // Widgets — active
        visuals.widgets.active.bg_fill              = Color32::BLACK;
        visuals.widgets.active.fg_stroke            = Stroke::new(2.0, RED);

        // Selection
        visuals.selection.bg_fill    = Color32::from_rgba_unmultiplied(255, 0, 60, 40);
        visuals.selection.stroke     = Stroke::new(1.0, RED);

        ctx.set_visuals(visuals);
        ctx.request_repaint_after(Duration::from_millis(33));

        CentralPanel::default().show(ctx, |ui| {
            let rect = ui.available_rect_before_wrap();
            let painter = ui.painter();
            let (width, height) = (rect.width(), rect.height());

            // ── District Grid ─────────────────────────────────────────────────
            for i in 0..=10 {
                let x = rect.left() + (i as f32 * width / 10.0);
                painter.line_segment(
                    [Pos2::new(x, rect.top()), Pos2::new(x, rect.bottom())],
                    Stroke::new(0.5, Color32::from_rgba_unmultiplied(255, 0, 60, 50)),
                );
                let y = rect.top() + (i as f32 * height / 10.0);
                painter.line_segment(
                    [Pos2::new(rect.left(), y), Pos2::new(rect.right(), y)],
                    Stroke::new(0.5, Color32::from_rgba_unmultiplied(255, 0, 60, 50)),
                );
            }

            // ── Radar Blips ───────────────────────────────────────────────────
            for blip in &self.blips {
                let center = Pos2::new(
                    rect.left() + (blip.x / 1000.0) * width,
                    rect.top() + (blip.y / 1000.0) * height,
                );
                if blip.actor_type == 1 {
                    painter.circle_filled(center, 6.0, Color32::WHITE);
                } else {
                    painter.circle_stroke(center, 5.0, Stroke::new(1.5, RED));
                }
                painter.text(
                    center + egui::vec2(0.0, 12.0),
                    egui::Align2::CENTER_TOP,
                    &blip.name,
                    FontId::monospace(10.0),
                    RED,
                );
            }

            // ── Ghost Blips ───────────────────────────────────────────────────
            // Clone the list to avoid borrow-checker conflict with `painter`.
            let ghost_blips: Vec<GhostBlip> = self.ghost_blips.clone();

            for gb in &ghost_blips {
                let cx = rect.left() + gb.x * width;
                let cy = rect.top() + gb.y * height;
                let center = Pos2::new(cx, cy);

                match gb.blip_type {
                    BLIP_COVER => {
                        // ── Green diamond (4 line segments) ──────────────────
                        let r = 8.0_f32;
                        let top    = Pos2::new(cx,       cy - r);
                        let right  = Pos2::new(cx + r,   cy);
                        let bottom = Pos2::new(cx,       cy + r);
                        let left   = Pos2::new(cx - r,   cy);
                        let stroke = Stroke::new(1.5, GREEN);
                        painter.line_segment([top, right],    stroke);
                        painter.line_segment([right, bottom], stroke);
                        painter.line_segment([bottom, left],  stroke);
                        painter.line_segment([left, top],     stroke);
                        painter.text(
                            center + egui::vec2(0.0, r + 4.0),
                            egui::Align2::CENTER_TOP,
                            "cover",
                            FontId::monospace(9.0),
                            GREEN,
                        );
                    }
                    BLIP_HAZARD => {
                        // ── Tactical heatmap: semi-transparent red circle ────
                        let heatmap_color = Color32::from_rgba_unmultiplied(0xff, 0x20, 0x20, 30);
                        painter.circle_filled(center, 40.0, heatmap_color);

                        // ── Red X (2 crossed lines) ──────────────────────────
                        let r = 7.0_f32;
                        let stroke = Stroke::new(2.0, RED);
                        painter.line_segment(
                            [Pos2::new(cx - r, cy - r), Pos2::new(cx + r, cy + r)],
                            stroke,
                        );
                        painter.line_segment(
                            [Pos2::new(cx + r, cy - r), Pos2::new(cx - r, cy + r)],
                            stroke,
                        );
                        painter.text(
                            center + egui::vec2(0.0, r + 4.0),
                            egui::Align2::CENTER_TOP,
                            "hazard",
                            FontId::monospace(9.0),
                            RED,
                        );
                    }
                    BLIP_OBJECTIVE => {
                        // ── Cyan crosshair (+) with circle ───────────────────
                        let r = 8.0_f32;
                        let stroke = Stroke::new(1.5, RED);
                        // Horizontal bar
                        painter.line_segment(
                            [Pos2::new(cx - r, cy), Pos2::new(cx + r, cy)],
                            stroke,
                        );
                        // Vertical bar
                        painter.line_segment(
                            [Pos2::new(cx, cy - r), Pos2::new(cx, cy + r)],
                            stroke,
                        );
                        // Outer circle
                        painter.circle_stroke(center, r + 3.0, stroke);
                        painter.text(
                            center + egui::vec2(0.0, r + 7.0),
                            egui::Align2::CENTER_TOP,
                            "objective",
                            FontId::monospace(9.0),
                            RED,
                        );
                    }
                    _ => {
                        // Unknown blip type — draw a small red dot
                        painter.circle_filled(center, 3.0, RED);
                    }
                }
            }

            // ── Status bar ────────────────────────────────────────────────────
            if let Some(err) = &self.last_error {
                painter.text(
                    rect.left_bottom() + egui::vec2(5.0, -5.0),
                    egui::Align2::LEFT_BOTTOM,
                    err.as_str(),
                    FontId::monospace(12.0),
                    RED,
                );
            } else {
                let status = format!(
                    ":/47L45-D43M0N // 5747U5: 4C71V3 | 7X: {} | 6H0575: {}",
                    self.transaction_counter,
                    self.ghost_blips.len()
                );
                painter.text(
                    rect.left_bottom() + egui::vec2(5.0, -5.0),
                    egui::Align2::LEFT_BOTTOM,
                    status,
                    FontId::monospace(12.0),
                    RED,
                );
            }
        });
    }
}

// ─── Entry point ─────────────────────────────────────────────────────────────

fn main() -> eframe::Result<()> {
    let args: Vec<String> = std::env::args().collect();
    let headless = args.iter().any(|a| a == "--headless");

    let mem_path = args.iter()
        .skip(1)
        .find(|a| !a.starts_with("--"))
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("black_ice_state.mem"));

    if headless {
        println!("[CL4W]: Starting Headless Atlas Daemon...");
        let mut app = AtlasApp::new(mem_path.clone());

        // ── Daemon Heartbeat — Mmap slot 4000 (byte offset 0 in heartbeat.mem) ──
        // heartbeat.mem layout: [slot4000: u64 LE ms][slot4001: u64 LE ms] (16 bytes)
        let hb_path = PathBuf::from("data/heartbeat.mem");
        let hb_file = OpenOptions::new()
            .read(true)
            .write(true)
            .create(true)
            .open(&hb_path)
            .expect("[CL4W] Cannot open data/heartbeat.mem");
        hb_file.set_len(16).expect("[CL4W] Cannot pre-allocate heartbeat.mem");
        // SAFETY: hb_file is held open for the lifetime of the mmap.
        let mut hb_mmap: MmapMut = unsafe { MmapOptions::new().map_mut(&hb_file) }
            .expect("[CL4W] Cannot mmap heartbeat.mem");

        loop {
            app.parse_state();
            app.parse_ghost_state();

            // Write current Unix timestamp (ms) at slot 4000 (offset 0)
            let now_ms = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            hb_mmap[0..8].copy_from_slice(&now_ms.to_le_bytes());
            let _ = hb_mmap.flush_range(0, 8);

            std::thread::sleep(Duration::from_millis(16));
        }
    }

    let mut options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title(":/50V3R31GN-M4CH1N4 // 47L45")
            .with_inner_size([800.0, 600.0]),
        ..Default::default()
    };

    // Load custom app icon from terminal-app/assets
    if let Ok(icon_bytes) = std::fs::read("../terminal-app/assets/app_icon.png") {
        if let Ok(image) = image::load_from_memory(&icon_bytes) {
            let image = image.to_rgba8();
            let (width, height) = image.dimensions();
            let rgba = image.into_raw();
            options.viewport.icon = Some(std::sync::Arc::new(egui::IconData {
                rgba,
                width,
                height,
            }));
        }
    }

    eframe::run_native(
        ":/50V3R31GN-M4CH1N4 // 47L45",
        options,
        Box::new(|_cc| Ok(Box::new(AtlasApp::new(mem_path)))),
    )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a minimal valid ghost buffer for `n` blips.
    fn make_ghost_buf(blips: &[(f32, f32, u8)]) -> Vec<u8> {
        let mut buf = Vec::new();
        // Magic (16 bytes)
        buf.extend_from_slice(GHOST_MAGIC);
        // Count (4 bytes, little-endian)
        buf.extend_from_slice(&(blips.len() as u32).to_le_bytes());
        // Blip entries (9 bytes each)
        for &(x, y, blip_type) in blips {
            buf.extend_from_slice(&x.to_le_bytes());
            buf.extend_from_slice(&y.to_le_bytes());
            buf.push(blip_type);
        }
        buf
    }

    /// T1 — A buffer with wrong magic must return 0 blips.
    #[test]
    fn test_ghost_blip_mmap_magic_check() {
        let mut bad = make_ghost_buf(&[(0.5, 0.5, BLIP_COVER)]);
        // Corrupt the magic bytes
        bad[0] = b'X';
        bad[1] = b'X';
        let result = parse_ghost_blips(&bad);
        assert_eq!(result.len(), 0, "Wrong magic should yield 0 blips");
    }

    /// T2 — A valid 2-blip ghost buffer must parse to exactly 2 blips with correct fields.
    #[test]
    fn test_ghost_blip_parse_count() {
        let input = vec![
            (0.25_f32, 0.75_f32, BLIP_COVER),
            (0.80_f32, 0.10_f32, BLIP_HAZARD),
        ];
        let buf = make_ghost_buf(&input);
        let result = parse_ghost_blips(&buf);

        assert_eq!(result.len(), 2, "Should parse exactly 2 ghost blips");

        // First blip
        assert!((result[0].x - 0.25).abs() < 1e-5, "Blip[0].x mismatch");
        assert!((result[0].y - 0.75).abs() < 1e-5, "Blip[0].y mismatch");
        assert_eq!(result[0].blip_type, BLIP_COVER);

        // Second blip
        assert!((result[1].x - 0.80).abs() < 1e-5, "Blip[1].x mismatch");
        assert!((result[1].y - 0.10).abs() < 1e-5, "Blip[1].y mismatch");
        assert_eq!(result[1].blip_type, BLIP_HAZARD);
    }

    /// T3 — A single-blip buffer with blip_type = BLIP_OBJECTIVE must round-trip correctly.
    #[test]
    fn test_ghost_blip_objective_round_trip() {
        // Build a 1-blip buffer with blip_type = BLIP_OBJECTIVE (0x03)
        let mut buf = vec![0u8; GHOST_HEADER_SIZE + GHOST_BLIP_SIZE];
        buf[0..16].copy_from_slice(GHOST_MAGIC);
        buf[16..20].copy_from_slice(&1u32.to_le_bytes());
        buf[20..24].copy_from_slice(&0.5f32.to_le_bytes()); // x
        buf[24..28].copy_from_slice(&0.8f32.to_le_bytes()); // y
        buf[28] = BLIP_OBJECTIVE;
        let blips = parse_ghost_blips(&buf);
        assert_eq!(blips.len(), 1);
        assert_eq!(blips[0].blip_type, BLIP_OBJECTIVE);
        assert!((blips[0].x - 0.5).abs() < 1e-6);
        assert!((blips[0].y - 0.8).abs() < 1e-6);
    }

    /// T4 — A buffer shorter than GHOST_HEADER_SIZE (20 bytes) must return 0 blips.
    #[test]
    fn test_ghost_mmap_header_truncated() {
        // 19 bytes — one short of the required header
        let truncated = vec![0u8; GHOST_HEADER_SIZE - 1];
        let result = parse_ghost_blips(&truncated);
        assert_eq!(result.len(), 0, "Truncated header should yield 0 blips");
    }

    /// T5 — Header claims 5 blips but buffer only has space for 2; parser must not panic.
    #[test]
    fn test_ghost_blip_count_exceeds_data() {
        // Header claims 5 blips, but buffer only has space for 2
        let mut buf = vec![0u8; GHOST_HEADER_SIZE + 2 * GHOST_BLIP_SIZE];
        buf[0..16].copy_from_slice(GHOST_MAGIC);
        buf[16..20].copy_from_slice(&5u32.to_le_bytes()); // claims 5
        // Fill 2 valid entries
        for i in 0..2usize {
            let base = GHOST_HEADER_SIZE + i * GHOST_BLIP_SIZE;
            buf[base..base+4].copy_from_slice(&(0.1f32 * i as f32).to_le_bytes());
            buf[base+4..base+8].copy_from_slice(&(0.2f32 * i as f32).to_le_bytes());
            buf[base+8] = BLIP_COVER;
        }
        let blips = parse_ghost_blips(&buf);
        assert_eq!(blips.len(), 2, "should only parse 2 blips despite count claiming 5");
    }
}
