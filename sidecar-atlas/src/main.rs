use eframe::egui;
use egui::{epaint, CentralPanel, Color32, FontId, Pos2, Stroke};
use memmap2::Mmap;
use std::fs::File;
use std::path::PathBuf;
use std::time::Duration;

// Black-Ice Cyan
const CYAN: Color32 = Color32::from_rgb(0x00, 0xf3, 0xff);

const MAGIC: &[u8; 16] = b"BLACK-ICE-RADAR\0";
const BLIP_SIZE: usize = 64;
const HEADER_SIZE: usize = 24;

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

fn parse_null_str(bytes: &[u8]) -> String {
    let end = bytes.iter().position(|&b| b == 0).unwrap_or(bytes.len());
    String::from_utf8_lossy(&bytes[..end]).into_owned()
}

struct AtlasApp {
    #[allow(dead_code)]
    file: Option<File>,
    mmap: Option<Mmap>,
    blips: Vec<RadarBlip>,
    transaction_counter: u32,
    last_error: Option<String>,
}

impl AtlasApp {
    fn new(mem_path: PathBuf) -> Self {
        let mut app = Self {
            file: None,
            mmap: None,
            blips: Vec::new(),
            transaction_counter: 0,
            last_error: None,
        };

        // Attempt initial map
        match File::open(&mem_path) {
            Ok(file) => {
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
        app
    }

    fn parse_state(&mut self) {
        let mmap = match &self.mmap {
            Some(m) => m,
            None => return,
        };

        let data = &mmap[..];
        if data.len() < HEADER_SIZE || &data[0..16] != MAGIC {
            self.last_error = Some("Invalid or truncated .mem file".to_string());
            return;
        }

        self.transaction_counter = u32::from_le_bytes(data[16..20].try_into().unwrap_or([0; 4]));
        let blip_count = u32::from_le_bytes(data[20..24].try_into().unwrap_or([0; 4])) as usize;

        let mut blips = Vec::with_capacity(blip_count);
        for i in 0..blip_count {
            let base = HEADER_SIZE + i * BLIP_SIZE;
            if data.len() < base + BLIP_SIZE { break; }
            
            let blip_data = &data[base..base + BLIP_SIZE];
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
}

impl eframe::App for AtlasApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.parse_state();

        let mut visuals = ctx.style().visuals.clone();

        // Backgrounds
        visuals.panel_fill           = Color32::from_rgb(5, 5, 5);
        visuals.window_fill          = Color32::BLACK;
        visuals.extreme_bg_color     = Color32::BLACK;
        visuals.faint_bg_color       = Color32::from_rgb(5, 5, 5);
        visuals.code_bg_color        = Color32::from_rgb(5, 5, 5);

        // Window chrome
        visuals.window_stroke        = Stroke::new(1.0, CYAN);
        visuals.window_shadow        = epaint::Shadow::NONE;
        visuals.popup_shadow         = epaint::Shadow::NONE;

        // Text
        visuals.override_text_color  = Some(Color32::from_rgb(238, 238, 238));

        // Widgets — noninteractive (labels, separators, frames)
        visuals.widgets.noninteractive.bg_fill      = Color32::from_rgb(5, 5, 5);
        visuals.widgets.noninteractive.weak_bg_fill = Color32::BLACK;
        visuals.widgets.noninteractive.bg_stroke    = Stroke::new(1.0, Color32::from_rgb(34, 34, 34));
        visuals.widgets.noninteractive.fg_stroke    = Stroke::new(1.0, CYAN);

        // Widgets — inactive (unhovered buttons etc.)
        visuals.widgets.inactive.bg_fill            = Color32::from_rgb(5, 5, 5);
        visuals.widgets.inactive.weak_bg_fill       = Color32::BLACK;
        visuals.widgets.inactive.fg_stroke          = Stroke::new(1.0, Color32::from_rgb(136, 136, 136));

        // Widgets — hovered
        visuals.widgets.hovered.bg_fill             = Color32::from_rgb(26, 26, 26);
        visuals.widgets.hovered.fg_stroke           = Stroke::new(1.5, CYAN);
        visuals.widgets.hovered.bg_stroke           = Stroke::new(1.0, CYAN);

        // Widgets — active (clicked)
        visuals.widgets.active.bg_fill              = Color32::BLACK;
        visuals.widgets.active.fg_stroke            = Stroke::new(2.0, CYAN);

        // Selection highlight
        visuals.selection.bg_fill    = Color32::from_rgba_unmultiplied(0, 243, 255, 40);
        visuals.selection.stroke     = Stroke::new(1.0, CYAN);

        ctx.set_visuals(visuals);

        ctx.request_repaint_after(Duration::from_millis(33));

        CentralPanel::default().show(ctx, |ui| {
            let rect = ui.available_rect_before_wrap();
            let painter = ui.painter();
            let (width, height) = (rect.width(), rect.height());

            // --- District Grid ---
            for i in 0..=10 {
                let x = rect.left() + (i as f32 * width / 10.0);
                painter.line_segment([Pos2::new(x, rect.top()), Pos2::new(x, rect.bottom())], Stroke::new(0.5, Color32::from_rgba_unmultiplied(0, 243, 255, 50)));
                let y = rect.top() + (i as f32 * height / 10.0);
                painter.line_segment([Pos2::new(rect.left(), y), Pos2::new(rect.right(), y)], Stroke::new(0.5, Color32::from_rgba_unmultiplied(0, 243, 255, 50)));
            }

            // --- Blips ---
            for blip in &self.blips {
                let center = Pos2::new(rect.left() + (blip.x / 1000.0) * width, rect.top() + (blip.y / 1000.0) * height);
                if blip.actor_type == 1 {
                    painter.circle_filled(center, 6.0, Color32::WHITE);
                } else {
                    painter.circle_stroke(center, 5.0, Stroke::new(1.5, CYAN));
                }
                painter.text(center + egui::vec2(0.0, 12.0), egui::Align2::CENTER_TOP, &blip.name, FontId::monospace(10.0), CYAN);
            }

            // --- Status ---
            let status = if let Some(err) = &self.last_error { err.clone() } else { format!("RADAR ACTIVE | TX: {}", self.transaction_counter) };
            painter.text(rect.left_bottom() + egui::vec2(5.0, -5.0), egui::Align2::LEFT_BOTTOM, status, FontId::monospace(12.0), CYAN);
        });
    }
}

fn main() -> eframe::Result<()> {
    let mem_path = std::env::args().nth(1).map(PathBuf::from).unwrap_or_else(|| PathBuf::from("black_ice_state.mem"));
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("STRATEGIC ATLAS | NIGHT CITY")
            .with_inner_size([800.0, 600.0]),
        ..Default::default()
    };
    eframe::run_native("Strategic Atlas", options, Box::new(|_cc| Ok(Box::new(AtlasApp::new(mem_path)))))
}
