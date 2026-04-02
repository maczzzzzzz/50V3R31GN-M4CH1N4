use eframe::egui;
use egui::{CentralPanel, Color32, FontId, Pos2, Stroke};
use memmap2::Mmap;
use std::fs::File;
use std::path::PathBuf;
use std::time::Duration;

// Black-Ice Cyan
const CYAN: Color32 = Color32::from_rgb(0x00, 0xf3, 0xff);
// Dimmed cyan (30% opacity, premultiplied: 0x00*77/255≈0, 0xf3*77/255≈72, 0xff*77/255≈76)
const CYAN_DIM: Color32 = Color32::from_rgba_premultiplied(0x00, 0x48, 0x4c, 77);

const MAGIC: &[u8; 16] = b"BLACK-ICE-RADAR\0";
const BLIP_SIZE: usize = 64;
const HEADER_SIZE: usize = 24;

#[derive(Debug, Clone)]
struct RadarBlip {
    id: String,
    name: String,
    x: f32,        // 0–1000
    y: f32,        // 0–1000
    hp: i32,
    actor_type: u8, // 0=NPC, 1=PC
    faction: String,
}

fn parse_null_str(bytes: &[u8]) -> String {
    let end = bytes.iter().position(|&b| b == 0).unwrap_or(bytes.len());
    String::from_utf8_lossy(&bytes[..end]).into_owned()
}

fn read_mem(data: &[u8]) -> Option<(u32, Vec<RadarBlip>)> {
    if data.len() < HEADER_SIZE {
        return None;
    }

    // Verify magic
    if &data[0..16] != MAGIC {
        return None;
    }

    let transaction_counter = u32::from_le_bytes(data[16..20].try_into().ok()?);
    let blip_count = u32::from_le_bytes(data[20..24].try_into().ok()?) as usize;

    let required = HEADER_SIZE + blip_count * BLIP_SIZE;
    if data.len() < required {
        return None;
    }

    let mut blips = Vec::with_capacity(blip_count);
    for i in 0..blip_count {
        let base = HEADER_SIZE + i * BLIP_SIZE;
        let blip_data = &data[base..base + BLIP_SIZE];

        let id = parse_null_str(&blip_data[0..16]);
        let name = parse_null_str(&blip_data[16..32]);
        let x = f32::from_le_bytes(blip_data[32..36].try_into().ok()?);
        let y = f32::from_le_bytes(blip_data[36..40].try_into().ok()?);
        let hp = i32::from_le_bytes(blip_data[40..44].try_into().ok()?);
        let actor_type = blip_data[44];
        let faction = parse_null_str(&blip_data[48..64]);

        blips.push(RadarBlip { id, name, x, y, hp, actor_type, faction });
    }

    Some((transaction_counter, blips))
}

struct AtlasApp {
    mem_path: PathBuf,
    blips: Vec<RadarBlip>,
    transaction_counter: u32,
    last_error: Option<String>,
}

impl AtlasApp {
    fn new(mem_path: PathBuf) -> Self {
        Self {
            mem_path,
            blips: Vec::new(),
            transaction_counter: 0,
            last_error: None,
        }
    }

    fn refresh(&mut self) {
        match File::open(&self.mem_path) {
            Err(e) => {
                self.last_error = Some(format!("Waiting for Node B... ({})", e));
                self.blips.clear();
            }
            Ok(file) => {
                match unsafe { Mmap::map(&file) } {
                    Err(e) => {
                        self.last_error = Some(format!("mmap error: {}", e));
                    }
                    Ok(mmap) => {
                        match read_mem(&mmap[..]) {
                            None => {
                                self.last_error = Some("Invalid or truncated .mem file".to_string());
                            }
                            Some((counter, blips)) => {
                                self.transaction_counter = counter;
                                self.blips = blips;
                                self.last_error = None;
                            }
                        }
                    }
                }
            }
        }
    }
}

impl eframe::App for AtlasApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // Refresh blip state every frame
        self.refresh();

        // Dark background
        let mut visuals = ctx.style().visuals.clone();
        visuals.panel_fill = Color32::from_rgb(0x08, 0x08, 0x10);
        ctx.set_visuals(visuals);

        // Target ~30 FPS
        ctx.request_repaint_after(Duration::from_millis(33));

        CentralPanel::default().show(ctx, |ui| {
            let rect = ui.available_rect_before_wrap();
            let painter = ui.painter();

            let width = rect.width();
            let height = rect.height();
            let cell_w = width / 10.0;
            let cell_h = height / 10.0;

            // --- 10x10 District Grid ---
            for row in 0..=10 {
                for col in 0..=10 {
                    let cell_rect = egui::Rect::from_min_size(
                        Pos2::new(rect.left() + col as f32 * cell_w, rect.top() + row as f32 * cell_h),
                        egui::Vec2::new(cell_w, cell_h),
                    );
                    painter.rect_stroke(
                        cell_rect,
                        0.0,
                        Stroke::new(1.0, CYAN_DIM),
                        egui::StrokeKind::Middle,
                    );
                }
            }

            // --- Transaction counter (top-right) ---
            let tx_text = format!("TX: {}", self.transaction_counter);
            let tx_pos = Pos2::new(rect.right() - 80.0, rect.top() + 4.0);
            painter.text(
                tx_pos,
                egui::Align2::LEFT_TOP,
                &tx_text,
                FontId::monospace(10.0),
                CYAN,
            );

            // --- Blips ---
            for blip in &self.blips {
                // Map 0–1000 to screen coords
                let sx = rect.left() + (blip.x / 1000.0) * width;
                let sy = rect.top() + (blip.y / 1000.0) * height;
                let center = Pos2::new(sx, sy);

                if blip.actor_type == 1 {
                    // PC: white filled circle
                    painter.circle_filled(center, 8.0, Color32::WHITE);
                } else {
                    // NPC: cyan circle stroke
                    painter.circle_stroke(center, 6.0, Stroke::new(1.5, CYAN));
                }

                // Label below dot
                painter.text(
                    Pos2::new(sx, sy + 10.0),
                    egui::Align2::CENTER_TOP,
                    &blip.name,
                    FontId::proportional(10.0),
                    CYAN,
                );
            }

            // --- Status bar (bottom) ---
            let status = if let Some(err) = &self.last_error {
                format!("BLIPS: 0 | {}", err)
            } else {
                format!("BLIPS: {} | ACTIVE", self.blips.len())
            };
            painter.text(
                Pos2::new(rect.left() + 4.0, rect.bottom() - 16.0),
                egui::Align2::LEFT_BOTTOM,
                &status,
                FontId::monospace(10.0),
                CYAN,
            );
        });
    }
}

fn main() -> eframe::Result<()> {
    let mem_path = std::env::args()
        .nth(1)
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("black_ice_state.mem"));

    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("Strategic Atlas — Night City Radar")
            .with_inner_size([800.0, 600.0])
            .with_min_inner_size([400.0, 400.0]),
        ..Default::default()
    };

    eframe::run_native(
        "Strategic Atlas",
        options,
        Box::new(|_cc| Ok(Box::new(AtlasApp::new(mem_path)))),
    )
}
