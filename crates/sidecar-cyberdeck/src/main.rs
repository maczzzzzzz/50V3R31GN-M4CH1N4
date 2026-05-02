use eframe::egui;
use egui::{epaint, CentralPanel, Color32, FontId, Pos2, Rect, Stroke};
use memmap2::{Mmap, MmapMut, MmapOptions};
use sovereign_sdk::protocol::{
    GhostBlip as GhostBlipProtocol, GHOST_BLIP_SIZE, GHOST_HEADER_SIZE, GHOST_MAGIC, RADAR_BLIP_SIZE,
    RADAR_HEADER_SIZE, RADAR_MAGIC, VSB_HOVERED_UNIT_OFFSET, VSB_HOVERED_UNIT_SIZE,
    VSB_IDENTITY_SWITCH_OFFSET, VSB_IDENTITY_SWITCH_SIZE,
};
use std::fs::{File, OpenOptions};
use std::path::PathBuf;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

mod glitch;
mod st3gg;
pub(crate) use glitch::GlitchEngine;

// ─── Clinical Canonical Palette (Phase 76, Task 3) ────────────────────────────
const RED: Color32   = Color32::from_rgb(0xFA, 0xBD, 0x2F); // Clinical Yellow — primary accent
const GREEN: Color32 = Color32::from_rgb(0xB8, 0xBB, 0x26); // Clinical Green
const BLACK: Color32 = Color32::from_rgb(0x28, 0x28, 0x28); // Clinical BG Hard
fn dim_red() -> Color32 {
    Color32::from_rgba_unmultiplied(0xFA, 0xBD, 0x2F, 60)
}

// ─── GhostBlip type constants ─────────────────────────────────────────────────
const BLIP_COVER: u8 = 0x01;
const BLIP_HAZARD: u8 = 0x02;
const BLIP_OBJECTIVE: u8 = 0x03;

// ─── Tab ──────────────────────────────────────────────────────────────────────

#[derive(PartialEq, Clone, Copy)]
enum Tab {
    Atlas,
    Netrun,
    Deck,
}

// ─── Radar structs ────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
#[allow(dead_code)]
struct RadarBlip {
    id: String,
    name: String,
    x: f32,
    y: f32,
    hp: i32,
    actor_type: u8,
    faction: String,
}

/// Local copy of the GhostBlip protocol struct.
#[derive(Debug, Clone, Copy)]
struct GhostBlip {
    pub x: f32,
    pub y: f32,
    pub blip_type: u8,
}

// ─── ICE Types ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
enum IceType {
    Firewall,
    Trace,
    Gate,
}

struct IceNode {
    col: i32,
    row: i32,
    ice_type: IceType,
    label: String,
    active: bool,
}

// ─── ScannedItem ──────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
#[allow(dead_code)]
pub(crate) struct ScannedItem {
    pub name: String,
    pub item_type: String, // "objective", "hazard", "cover"
    pub x: f32,
    pub y: f32,
}

// ─── Phase 39: HoveredUnit ────────────────────────────────────────────────────

/// Phase 39 transient biometric hover data.
/// Layout: active(1) | id(16) | type(8) | x_f32(4) | y_f32(4) | imgPath(100)
/// Canonical offset defined in sovereign-sdk::protocol::VSB_HOVERED_UNIT_OFFSET.
const HOVERED_UNIT_OFFSET: usize = VSB_HOVERED_UNIT_OFFSET; // 3205
const HOVERED_UNIT_SIZE: usize   = VSB_HOVERED_UNIT_SIZE;   // 133

#[derive(Debug, Clone)]
struct HoveredUnit {
    id:        String,
    unit_type: String,
    x:         f32,
    y:         f32,
    img_path:  String,
}

/// Phase 39 Quick Hack definitions.
struct QuickHack {
    label:  &'static str,
    action: &'static str,
}

const QUICK_HACKS: &[QuickHack] = &[
    QuickHack { label: "SY573M-5H0CK    // [ELEC DMG]",    action: "sy573m-5h0ck"    },
    QuickHack { label: "OP71C5-D15RUP7  // [BLINDED]",     action: "op71c5-d15rup7"  },
    QuickHack { label: "5YNP471C-OV3RL0AD // [HUM DMG]",   action: "5ynp471c-ov3rl0ad" },
    QuickHack { label: "BR41N-W1P3      // [RESET INIT]",  action: "br41n-w1p3"      },
];

// ─── Parsing helpers ──────────────────────────────────────────────────────────

fn parse_null_str(bytes: &[u8]) -> String {
    let end = bytes.iter().position(|&b| b == 0).unwrap_or(bytes.len());
    String::from_utf8_lossy(&bytes[..end]).into_owned()
}

fn parse_ghost_blips(data: &[u8]) -> Vec<GhostBlip> {
    if data.len() < GHOST_HEADER_SIZE {
        return Vec::new();
    }
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
        let entry = &data[base..base + GHOST_BLIP_SIZE];
        let gb = GhostBlipProtocol::decode(entry.try_into().unwrap());
        blips.push(GhostBlip {
            x: gb.x,
            y: gb.y,
            blip_type: gb.blip_type,
        });
    }
    blips
}

// ─── Isometric Math ──────────────────────────────────────────────────────────

pub(crate) fn iso_to_screen(col: i32, row: i32, tile_w: f32, tile_h: f32, origin: Pos2) -> Pos2 {
    Pos2 {
        x: origin.x + (col as f32 - row as f32) * (tile_w / 2.0),
        y: origin.y + (col as f32 + row as f32) * (tile_h / 2.0),
    }
}

pub(crate) fn grid_origin(
    rect: egui::Rect,
    grid_cols: i32,
    grid_rows: i32,
    tile_w: f32,
    tile_h: f32,
) -> Pos2 {
    let total_h = (grid_cols + grid_rows) as f32 * (tile_h / 2.0);
    let center = rect.center();
    Pos2 {
        x: center.x - grid_rows as f32 * (tile_w / 2.0),
        y: center.y - total_h / 2.0,
    }
}

// ─── App ──────────────────────────────────────────────────────────────────────

struct CyberdeckApp {
    active_tab: Tab,

    // ── Atlas / Radar state ──────────────────────────────────────────────────
    #[allow(dead_code)]
    radar_file: Option<File>,
    radar_mmap: Option<Mmap>,
    blips: Vec<RadarBlip>,
    transaction_counter: u32,
    last_error: Option<String>,
    selected_id: Option<String>,

    // ── Ghost blip state ──────────────────────────────────────────────────────
    #[allow(dead_code)]
    ghost_file: Option<File>,
    ghost_mmap: Option<Mmap>,
    ghost_blips: Vec<GhostBlip>,
    ghost_path: PathBuf,

    // ── Netrun state ──────────────────────────────────────────────────────────
    ice_nodes: Vec<IceNode>,
    grid_cols: i32,
    grid_rows: i32,
    intrusion_level: f32,

    // ── Deck/Hacks state ──────────────────────────────────────────────────────
    scanned_items: Vec<ScannedItem>,
    scan_active: bool,
    decoded_stats: Option<serde_json::Value>,

    // ── Glitch engine ─────────────────────────────────────────────────────────
    glitch: GlitchEngine,

    // ── System Control (Phase 28 Task 4) ─────────────────────────────────────
    sys_ctrl_rx: Option<std::sync::mpsc::Receiver<String>>,
    sys_ctrl_output: Vec<String>,

    // ── Phase 40: Tactical Heat Radar ─────────────────────────────────────────
    radar_active: bool,
    radar_heat: u8,
    radar_public: bool,

    // ── Phase 39: Infiltration Scanner ────────────────────────────────────────
    hovered_unit: Option<HoveredUnit>,

    // ── Phase 76/77: Identity Switch (Clinical vs. Red theme gate) ─────────────
    active_profile: Option<String>,
}

impl CyberdeckApp {
    fn new(mem_path: PathBuf) -> Self {
        let ghost_path = {
            let mut p = mem_path.clone().into_os_string();
            p.push(".ghost");
            PathBuf::from(p)
        };

        let mut app = Self {
            active_tab: Tab::Atlas,
            radar_file: None,
            radar_mmap: None,
            blips: Vec::new(),
            transaction_counter: 0,
            last_error: None,
            selected_id: None,
            ghost_file: None,
            ghost_mmap: None,
            ghost_blips: Vec::new(),
            ghost_path,
            ice_nodes: Self::default_ice_nodes(),
            grid_cols: 8,
            grid_rows: 8,
            intrusion_level: 0.0,
            scanned_items: Vec::new(),
            scan_active: false,
            decoded_stats: None,
            glitch: GlitchEngine::new(),
            sys_ctrl_rx: None,
            sys_ctrl_output: Vec::new(),
            radar_active: false,
            radar_heat: 0,
            radar_public: false,
            hovered_unit: None,
            active_profile: None,
        };

        // Map the radar file
        if let Ok(file) = File::open(&mem_path) {
            // SAFETY: file stored alongside Mmap; Node A only appends/overwrites atomically.
            if let Ok(mmap) = unsafe { Mmap::map(&file) } {
                app.radar_mmap = Some(mmap);
                app.radar_file = Some(file);
            }
        } else {
            app.last_error = Some("Waiting for Node B...".to_string());
        }

        app.try_open_ghost();
        app
    }

    fn default_ice_nodes() -> Vec<IceNode> {
        vec![
            IceNode { col: 1, row: 1, ice_type: IceType::Firewall, label: "FW-ALPHA".into(), active: true },
            IceNode { col: 3, row: 2, ice_type: IceType::Trace,    label: "TRACE-1".into(),  active: true },
            IceNode { col: 5, row: 3, ice_type: IceType::Gate,     label: "GATE-A".into(),   active: true },
            IceNode { col: 2, row: 5, ice_type: IceType::Firewall, label: "FW-BETA".into(),  active: false },
            IceNode { col: 6, row: 1, ice_type: IceType::Trace,    label: "TRACE-2".into(),  active: true },
            IceNode { col: 7, row: 4, ice_type: IceType::Gate,     label: "GATE-B".into(),   active: true },
        ]
    }

    fn try_open_ghost(&mut self) {
        if self.ghost_mmap.is_some() {
            return;
        }
        if let Ok(file) = File::open(&self.ghost_path) {
            // SAFETY: file stored alongside Mmap; atomically written by Node A.
            if let Ok(mmap) = unsafe { Mmap::map(&file) } {
                self.ghost_mmap = Some(mmap);
                self.ghost_file = Some(file);
            }
        }
    }

    fn parse_radar_state(&mut self) {
        let mmap = match &self.radar_mmap {
            Some(m) => m,
            None => return,
        };
        let data = &mmap[..];
        if data.len() < RADAR_HEADER_SIZE || &data[0..16] != RADAR_MAGIC {
            self.last_error = Some("Invalid or truncated .mem file".to_string());
            return;
        }
        self.transaction_counter =
            u32::from_le_bytes(data[16..20].try_into().unwrap_or([0; 4]));
        let blip_count =
            u32::from_le_bytes(data[20..24].try_into().unwrap_or([0; 4])) as usize;

        let mut blips = Vec::with_capacity(blip_count);
        for i in 0..blip_count {
            let base = RADAR_HEADER_SIZE + i * RADAR_BLIP_SIZE;
            if data.len() < base + RADAR_BLIP_SIZE {
                break;
            }
            let d = &data[base..base + RADAR_BLIP_SIZE];
            blips.push(RadarBlip {
                id: parse_null_str(&d[0..16]),
                name: parse_null_str(&d[16..32]),
                x: f32::from_le_bytes(d[32..36].try_into().unwrap_or([0; 4])),
                y: f32::from_le_bytes(d[36..40].try_into().unwrap_or([0; 4])),
                hp: i32::from_le_bytes(d[40..44].try_into().unwrap_or([0; 4])),
                actor_type: d[44],
                faction: parse_null_str(&d[48..64]),
            });
        }
        self.blips = blips;
        self.last_error = None;
    }

    /// Phase 39: Parse transient biometric hover slot from Mmap at HOVERED_UNIT_OFFSET.
    fn parse_hovered_unit(&mut self) {
        let mmap = match &self.radar_mmap {
            Some(m) => m,
            None => { self.hovered_unit = None; return; }
        };
        let data = &mmap[..];
        if data.len() < HOVERED_UNIT_OFFSET + HOVERED_UNIT_SIZE {
            self.hovered_unit = None;
            return;
        }
        let base = HOVERED_UNIT_OFFSET;
        if data[base] != 0x01 {
            self.hovered_unit = None;
            return;
        }
        self.hovered_unit = Some(HoveredUnit {
            id:        parse_null_str(&data[base + 1  .. base + 17]),
            unit_type: parse_null_str(&data[base + 17 .. base + 25]),
            x:         f32::from_le_bytes(data[base + 25 .. base + 29].try_into().unwrap_or([0; 4])),
            y:         f32::from_le_bytes(data[base + 29 .. base + 33].try_into().unwrap_or([0; 4])),
            img_path:  parse_null_str(&data[base + 33 .. base + 133]),
        });
    }

    /// Phase 77: Read IDENTITY_SWITCH slot from VSB mmap.
    /// When active, updates active_profile — which gates Clinical vs. Red theme.
    fn parse_identity_switch(&mut self) {
        let mmap = match &self.radar_mmap {
            Some(m) => m,
            None => return,
        };
        let data = &mmap[..];
        if data.len() < VSB_IDENTITY_SWITCH_OFFSET + VSB_IDENTITY_SWITCH_SIZE {
            return;
        }
        let base = VSB_IDENTITY_SWITCH_OFFSET;
        if data[base] == 0x01 {
            let name = parse_null_str(&data[base + 1 .. base + VSB_IDENTITY_SWITCH_SIZE]);
            if !name.is_empty() {
                self.active_profile = Some(name);
            }
        }
    }

    fn parse_ghost_state(&mut self) {
        self.try_open_ghost();
        self.ghost_blips = match &self.ghost_mmap {
            Some(mmap) => parse_ghost_blips(&mmap[..]),
            None => Vec::new(),
        };
    }

    fn perform_scan(&mut self) {
        self.scanned_items.clear();
        for gb in &self.ghost_blips {
            let (name, item_type) = match gb.blip_type {
                BLIP_OBJECTIVE => (format!("OBJ@({:.2},{:.2})", gb.x, gb.y), "objective"),
                BLIP_HAZARD => (format!("HAZ@({:.2},{:.2})", gb.x, gb.y), "hazard"),
                BLIP_COVER => (format!("CVR@({:.2},{:.2})", gb.x, gb.y), "cover"),
                _ => continue,
            };
            self.scanned_items.push(ScannedItem {
                name,
                item_type: item_type.to_string(),
                x: gb.x,
                y: gb.y,
            });
        }
        self.scan_active = true;
    }

    // ── Rendering ──────────────────────────────────────────────────────────────

    fn render_atlas_tab(&mut self, ui: &mut egui::Ui) {
        let rect = ui.available_rect_before_wrap();
        let painter = ui.painter();
        let (width, height) = (rect.width(), rect.height());

        // District grid
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

        // Radar blips
        for blip in &self.blips {
            let center = Pos2::new(
                rect.left() + (blip.x / 1000.0) * width,
                rect.top() + (blip.y / 1000.0) * height,
            );
            
            // Selection logic
            let is_selected = self.selected_id.as_ref() == Some(&blip.id);
            let color = if is_selected { Color32::WHITE } else { RED };
            let radius = if is_selected { 8.0 } else { 5.0 };

            if blip.actor_type == 1 {
                painter.circle_filled(center, 6.0, Color32::WHITE);
            } else {
                painter.circle_stroke(center, radius, Stroke::new(1.5, color));
            }

            // Click detection
            let interact_rect = Rect::from_center_size(center, egui::vec2(20.0, 20.0));
            let response = ui.interact(interact_rect, egui::Id::new(&blip.id), egui::Sense::click());
            if response.clicked() {
                self.selected_id = Some(blip.id.clone());
                self.decoded_stats = None; // Reset stats when selection changes
            }

            painter.text(
                center + egui::vec2(0.0, 12.0),
                egui::Align2::CENTER_TOP,
                &blip.name,
                FontId::monospace(10.0),
                color,
            );
        }

        // Phase 40: Tactical Heat Radar Widget
        if self.radar_active {
            let heat_pct = self.radar_heat as f32 / 255.0;
            let radar_center = Pos2::new(rect.right() - 40.0, rect.top() + 40.0);
            
            // Background pulsing
            let pulse = (ui.input(|i| i.time) as f32 * (2.0 + heat_pct * 5.0)).sin() * 0.5 + 0.5;
            let heat_color = if heat_pct > 0.7 { RED } else { Color32::from_rgb(255, 170, 0) };
            
            painter.circle_filled(
                radar_center,
                20.0 + (pulse as f32 * 5.0),
                Color32::from_rgba_unmultiplied(heat_color.r(), heat_color.g(), heat_color.b(), 40)
            );
            painter.circle_stroke(radar_center, 20.0, Stroke::new(2.0, heat_color));

            // Scanning line
            let angle = ui.input(|i| i.time) as f32 * 3.0;
            let end_x = radar_center.x + angle.cos() * 20.0;
            let end_y = radar_center.y + angle.sin() * 20.0;
            painter.line_segment([radar_center, Pos2::new(end_x, end_y)], Stroke::new(1.5, Color32::WHITE));

            // Status Text
            let status = if self.radar_public { "PUBLIC" } else { "STEALTH" };
            painter.text(
                radar_center + egui::vec2(0.0, 30.0),
                egui::Align2::CENTER_TOP,
                format!("H:{:03} [{}]", self.radar_heat, status),
                FontId::monospace(10.0),
                heat_color,
            );
        }

        // Ghost blips
        let ghost_blips = self.ghost_blips.clone();
        for gb in &ghost_blips {
            let cx = rect.left() + gb.x * width;
            let cy = rect.top() + gb.y * height;
            let center = Pos2::new(cx, cy);
            match gb.blip_type {
                BLIP_COVER => {
                    let r = 8.0_f32;
                    let top    = Pos2::new(cx, cy - r);
                    let right  = Pos2::new(cx + r, cy);
                    let bottom = Pos2::new(cx, cy + r);
                    let left   = Pos2::new(cx - r, cy);
                    let stroke = Stroke::new(1.5, GREEN);
                    painter.line_segment([top, right], stroke);
                    painter.line_segment([right, bottom], stroke);
                    painter.line_segment([bottom, left], stroke);
                    painter.line_segment([left, top], stroke);
                    painter.text(center + egui::vec2(0.0, r + 4.0), egui::Align2::CENTER_TOP, "cover", FontId::monospace(9.0), GREEN);
                }
                BLIP_HAZARD => {
                    let heatmap = Color32::from_rgba_unmultiplied(0xff, 0x20, 0x20, 30);
                    painter.circle_filled(center, 40.0, heatmap);
                    let r = 7.0_f32;
                    let stroke = Stroke::new(2.0, RED);
                    painter.line_segment([Pos2::new(cx - r, cy - r), Pos2::new(cx + r, cy + r)], stroke);
                    painter.line_segment([Pos2::new(cx + r, cy - r), Pos2::new(cx - r, cy + r)], stroke);
                    painter.text(center + egui::vec2(0.0, r + 4.0), egui::Align2::CENTER_TOP, "hazard", FontId::monospace(9.0), RED);
                }
                BLIP_OBJECTIVE => {
                    let r = 8.0_f32;
                    let stroke = Stroke::new(1.5, RED);
                    painter.line_segment([Pos2::new(cx - r, cy), Pos2::new(cx + r, cy)], stroke);
                    painter.line_segment([Pos2::new(cx, cy - r), Pos2::new(cx, cy + r)], stroke);
                    painter.circle_stroke(center, r + 3.0, stroke);
                    painter.text(center + egui::vec2(0.0, r + 7.0), egui::Align2::CENTER_TOP, "objective", FontId::monospace(9.0), RED);
                }
                _ => { painter.circle_filled(center, 3.0, RED); }
            }
        }

        // Status bar
        if let Some(err) = &self.last_error {
            painter.text(rect.left_bottom() + egui::vec2(5.0, -5.0), egui::Align2::LEFT_BOTTOM, err.as_str(), FontId::monospace(12.0), RED);
        } else {
            let status = format!(":/47L45-D43M0N // 5747U5: 4C71V3 | 7X: {} | 6H0575: {}", self.transaction_counter, self.ghost_blips.len());
            painter.text(rect.left_bottom() + egui::vec2(5.0, -5.0), egui::Align2::LEFT_BOTTOM, status, FontId::monospace(12.0), RED);
        }
    }

    fn render_netrun_tab(&self, ui: &mut egui::Ui) {
        let rect = ui.available_rect_before_wrap();
        let painter = ui.painter();

        painter.rect_filled(rect, 0.0, BLACK);

        let tile_w = 64.0_f32;
        let tile_h = 32.0_f32;
        let origin = grid_origin(rect, self.grid_cols, self.grid_rows, tile_w, tile_h);
        let grid_stroke = Stroke::new(0.5, dim_red());

        for row in 0..=self.grid_rows {
            let start = iso_to_screen(0, row, tile_w, tile_h, origin);
            let end = iso_to_screen(self.grid_cols, row, tile_w, tile_h, origin);
            painter.line_segment([start, end], grid_stroke);
        }
        for col in 0..=self.grid_cols {
            let start = iso_to_screen(col, 0, tile_w, tile_h, origin);
            let end = iso_to_screen(col, self.grid_rows, tile_w, tile_h, origin);
            painter.line_segment([start, end], grid_stroke);
        }

        let node_count = self.ice_nodes.len();
        for i in 0..node_count {
            let col = self.ice_nodes[i].col;
            let row = self.ice_nodes[i].row;
            let ice_type = self.ice_nodes[i].ice_type.clone();
            let label = self.ice_nodes[i].label.clone();
            let active = self.ice_nodes[i].active;

            let mid = iso_to_screen(col, row, tile_w, tile_h, origin);
            let cx = mid.x;
            let cy = mid.y + (tile_h / 2.0);
            let center = Pos2::new(cx, cy);

            match ice_type {
                IceType::Firewall => {
                    let r = 10.0_f32;
                    let color = if active { RED } else { dim_red() };
                    let stroke = Stroke::new(1.5, color);
                    painter.line_segment([Pos2::new(cx, cy - r), Pos2::new(cx + r, cy)], stroke);
                    painter.line_segment([Pos2::new(cx + r, cy), Pos2::new(cx, cy + r)], stroke);
                    painter.line_segment([Pos2::new(cx, cy + r), Pos2::new(cx - r, cy)], stroke);
                    painter.line_segment([Pos2::new(cx - r, cy), Pos2::new(cx, cy - r)], stroke);
                    painter.text(center + egui::vec2(0.0, r + 4.0), egui::Align2::CENTER_TOP, &label, FontId::monospace(9.0), RED);
                }
                IceType::Trace => {
                    if active {
                        painter.circle_filled(center, 8.0, RED);
                    } else {
                        painter.circle_stroke(center, 8.0, Stroke::new(1.5, RED));
                    }
                    painter.text(center + egui::vec2(0.0, 12.0), egui::Align2::CENTER_TOP, &label, FontId::monospace(9.0), RED);
                }
                IceType::Gate => {
                    let half = 6.0_f32;
                    let tl = Pos2::new(cx - half, cy - half);
                    let tr = Pos2::new(cx + half, cy - half);
                    let br = Pos2::new(cx + half, cy + half);
                    let bl = Pos2::new(cx - half, cy + half);
                    let stroke = Stroke::new(1.5, Color32::WHITE);
                    painter.line_segment([tl, tr], stroke);
                    painter.line_segment([tr, br], stroke);
                    painter.line_segment([br, bl], stroke);
                    painter.line_segment([bl, tl], stroke);
                    painter.text(center + egui::vec2(0.0, half + 4.0), egui::Align2::CENTER_TOP, &label, FontId::monospace(9.0), Color32::WHITE);
                }
            }
        }

        let status = format!(
            "NETRUNNER HUD v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS | NODES: {} | INTRUSION: {:.0}%",
            node_count,
            self.intrusion_level * 100.0
        );
        painter.text(
            rect.left_bottom() + egui::vec2(5.0, -5.0),
            egui::Align2::LEFT_BOTTOM,
            status,
            FontId::monospace(11.0),
            if self.intrusion_level > 0.7 { RED } else { RED },
        );

        if self.intrusion_level > 0.3 {
            let flash = (ui.input(|i| i.time) * 5.0).sin() > 0.0;
            if flash {
                painter.text(
                    rect.center() + egui::vec2(0.0, -100.0),
                    egui::Align2::CENTER_CENTER,
                    "!! INTRUSION DETECTED !!",
                    FontId::monospace(24.0),
                    RED,
                );
                painter.rect_stroke(rect, 0.0, Stroke::new(2.0, RED), egui::StrokeKind::Middle);
            }
        }
    }

    fn render_deck_tab(&mut self, ui: &mut egui::Ui) {
        // ── Phase 39: Infiltration Scanner ────────────────────────────────────
        ui.heading(":/1NF1L7R4710N-5C4NN3R //");
        ui.separator();

        if let Some(hovered) = self.hovered_unit.clone() {
            egui::Frame::default()
                .fill(Color32::from_rgb(10, 0, 0))
                .stroke(Stroke::new(1.0, RED))
                .inner_margin(egui::Margin::same(8))
                .show(ui, |ui| {
                    ui.horizontal(|ui| {
                        ui.colored_label(RED, "◈ 74R637:");
                        ui.colored_label(Color32::WHITE, &hovered.id);
                        ui.colored_label(Color32::from_rgb(120, 120, 120), format!("[{}]", hovered.unit_type));
                    });
                    ui.horizontal(|ui| {
                        ui.colored_label(Color32::from_rgb(120, 120, 120), "POS:");
                        ui.colored_label(Color32::WHITE, format!("x:{:.1} y:{:.1}", hovered.x, hovered.y));
                    });
                    if !hovered.img_path.is_empty() {
                        ui.horizontal(|ui| {
                            ui.colored_label(Color32::from_rgb(120, 120, 120), "4557:");
                            ui.colored_label(Color32::from_rgb(180, 180, 180), &hovered.img_path);
                        });
                    }

                    ui.add_space(8.0);
                    ui.colored_label(RED, ">> QU1CK-H4CK-C0N50L3 //");
                    ui.add_space(4.0);

                    let target_id = hovered.id.clone();
                    for hack in QUICK_HACKS {
                        if ui.button(hack.label).clicked() {
                            self.spawn_sys_command(
                                "crush",
                                &["hack", hack.action, &target_id],
                            );
                        }
                    }
                });
        } else {
            ui.colored_label(
                Color32::from_rgb(60, 60, 60),
                "[ N0-74R637-H0V3R3D — M0V3-0V3R-70K3N-70-5C4N ]",
            );
        }

        ui.add_space(16.0);

        ui.heading(":/CYB3RD3CK-B10M37R1C5 //");
        ui.separator();

        if let Some(id) = &self.selected_id {
            let blip = self.blips.iter().find(|b| &b.id == id);
            let name = blip.map(|b| b.name.as_str()).unwrap_or("Unknown");
            
            ui.horizontal(|ui| {
                ui.label("53L3C73D:");
                ui.colored_label(RED, name);
                ui.label(format!("({})", id));
            });

            ui.add_space(10.0);

            if ui.button("L04D-5M4R7-P0R7R417 // [57366]").clicked() {
                // Try to find image in data/assets/{id}.png
                let img_path = PathBuf::from("data/assets").join(format!("{}.png", id));
                if let Ok(img_bytes) = std::fs::read(&img_path) {
                    match st3gg::decode_json(&img_bytes) {
                        Ok(val) => {
                            self.decoded_stats = Some(val);
                            self.last_error = None;
                        }
                        Err(e) => {
                            self.last_error = Some(format!("57366-3RR0R: {}", e));
                        }
                    }
                } else {
                    self.last_error = Some(format!("45537-N07-F0UND: {:?}", img_path));
                }
            }

            if let Some(stats) = &self.decoded_stats {
                ui.add_space(10.0);
                ui.colored_label(GREEN, ">> D474-D3C0D3D-5UCC355FULLY //");
                egui::ScrollArea::vertical().show(ui, |ui| {
                    ui.label(serde_json::to_string_pretty(stats).unwrap_or_default());
                });
            } else if let Some(err) = &self.last_error {
                ui.colored_label(RED, format!("!! 3RR0R: {}", err));
            }

        } else {
            ui.colored_label(Color32::from_rgb(100, 100, 100), "[ N0-4C70R-53L3C73D-1N-47L45 ]");
        }

        ui.add_space(20.0);
        ui.separator();
        ui.heading(":/5C4NN3R-W54 //");

        ui.horizontal(|ui| {
            if ui.button("R3V34L-P0R75 // [5C4N]").clicked() {
                self.perform_scan();
            }
            if self.scan_active {
                ui.colored_label(GREEN, format!("{} 74R6375-4CQU1R3D", self.scanned_items.len()));
            }
        });

        if !self.scanned_items.is_empty() {
            egui::ScrollArea::vertical().show(ui, |ui| {
                let items = self.scanned_items.clone();
                for item in &items {
                    let color = match item.item_type.as_str() {
                        "objective" => RED,
                        "hazard"    => RED,
                        "cover"     => GREEN,
                        _           => Color32::WHITE,
                    };
                    ui.horizontal(|ui| {
                        ui.colored_label(color, format!("[{}]", item.item_type.to_uppercase()));
                        ui.label(&item.name);
                    });
                }
            });
        }

        // ── System Control ────────────────────────────────────────────────────
        ui.add_space(20.0);
        ui.separator();
        ui.heading(":/5Y573M-C0N7R0L //");

        // Drain any pending output from background commands.
        if let Some(rx) = &self.sys_ctrl_rx {
            while let Ok(line) = rx.try_recv() {
                self.sys_ctrl_output.push(line);
            }
        }

        ui.horizontal(|ui| {
            if ui.button("R3BU1LD-5Y573M // [N1X]").clicked() {
                self.spawn_sys_command(
                    "nixos-rebuild",
                    &["switch", "--flake", ".#"],
                );
            }
            if ui.button("R3B007-N0D3-4 // [55H]").clicked() {
                self.spawn_sys_command(
                    "ssh",
                    &["node-a", "sudo", "reboot"],
                );
            }
            if ui.button("CL34R").clicked() {
                self.sys_ctrl_output.clear();
            }
        });

        if !self.sys_ctrl_output.is_empty() {
            ui.add_space(6.0);
            egui::ScrollArea::vertical()
                .max_height(120.0)
                .show(ui, |ui| {
                    for line in &self.sys_ctrl_output {
                        ui.colored_label(GREEN, line);
                    }
                });
        }
    }

    /// Spawn a system command in a background thread and pipe its output
    /// back through `sys_ctrl_rx` for display in the DECK tab.
    fn spawn_sys_command(&mut self, program: &str, args: &[&str]) {
        let (tx, rx) = std::sync::mpsc::channel::<String>();
        self.sys_ctrl_rx = Some(rx);
        self.sys_ctrl_output.push(format!("> {} {}", program, args.join(" ")));

        let program = program.to_string();
        let args: Vec<String> = args.iter().map(|s| s.to_string()).collect();

        std::thread::spawn(move || {
            let result = std::process::Command::new(&program)
                .args(&args)
                .output();
            match result {
                Ok(out) => {
                    let stdout = String::from_utf8_lossy(&out.stdout);
                    let stderr = String::from_utf8_lossy(&out.stderr);
                    for line in stdout.lines() {
                        let _ = tx.send(line.to_string());
                    }
                    for line in stderr.lines() {
                        let _ = tx.send(format!("[ERR] {}", line));
                    }
                    let code = out.status.code().unwrap_or(-1);
                    let _ = tx.send(format!(">> EXIT {}", code));
                }
                Err(e) => {
                    let _ = tx.send(format!("[FATAL] {}", e));
                }
            }
        });
    }
}

// ─── eframe::App ──────────────────────────────────────────────────────────────

impl eframe::App for CyberdeckApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.parse_radar_state();
        self.parse_ghost_state();
        self.parse_hovered_unit();
        self.parse_identity_switch();

        // Sync intrusion_level into glitch engine
        let il = self.intrusion_level;
        self.glitch.set_intensity(il);

        // ── Visuals ───────────────────────────────────────────────────────────
        let mut visuals = ctx.style().visuals.clone();
        visuals.panel_fill           = Color32::from_rgb(5, 5, 5);
        visuals.window_fill          = BLACK;
        visuals.extreme_bg_color     = BLACK;
        visuals.faint_bg_color       = Color32::from_rgb(5, 5, 5);
        visuals.code_bg_color        = Color32::from_rgb(5, 5, 5);
        visuals.window_stroke        = Stroke::new(1.0, RED);
        visuals.window_shadow        = epaint::Shadow::NONE;
        visuals.popup_shadow         = epaint::Shadow::NONE;
        visuals.override_text_color  = Some(Color32::from_rgb(238, 238, 238));
        visuals.widgets.noninteractive.bg_fill      = Color32::from_rgb(5, 5, 5);
        visuals.widgets.noninteractive.weak_bg_fill = BLACK;
        visuals.widgets.noninteractive.bg_stroke    = Stroke::new(1.0, Color32::from_rgb(34, 34, 34));
        visuals.widgets.noninteractive.fg_stroke    = Stroke::new(1.0, RED);
        visuals.widgets.inactive.bg_fill            = Color32::from_rgb(5, 5, 5);
        visuals.widgets.inactive.weak_bg_fill       = BLACK;
        visuals.widgets.inactive.fg_stroke          = Stroke::new(1.0, Color32::from_rgb(136, 136, 136));
        visuals.widgets.hovered.bg_fill             = Color32::from_rgb(26, 26, 26);
        visuals.widgets.hovered.fg_stroke           = Stroke::new(1.5, RED);
        visuals.widgets.hovered.bg_stroke           = Stroke::new(1.0, RED);
        visuals.widgets.active.bg_fill              = BLACK;
        visuals.widgets.active.fg_stroke            = Stroke::new(2.0, RED);
        visuals.selection.bg_fill    = Color32::from_rgba_unmultiplied(255, 0, 60, 40);
        visuals.selection.stroke     = Stroke::new(1.0, RED);
        ctx.set_visuals(visuals);
        ctx.request_repaint_after(Duration::from_millis(33));

        CentralPanel::default().show(ctx, |ui| {
            // ── Tab bar ───────────────────────────────────────────────────────
            ui.horizontal(|ui| {
                ui.selectable_value(&mut self.active_tab, Tab::Atlas,  ":/47L45 //");
                // Netrun tab pulses red when intruded
                let netrun_label = if self.intrusion_level > 0.3 { "::/N37RUN !! //" } else { ":/N37RUN //" };
                let netrun_color = if self.intrusion_level > 0.3 { RED } else { RED };
                if ui.add(egui::SelectableLabel::new(
                    self.active_tab == Tab::Netrun,
                    egui::RichText::new(netrun_label).color(netrun_color),
                )).clicked() {
                    self.active_tab = Tab::Netrun;
                }
                ui.selectable_value(&mut self.active_tab, Tab::Deck, ":/D3CK //");
            });
            ui.separator();

            match self.active_tab {
                Tab::Atlas  => self.render_atlas_tab(ui),
                Tab::Netrun => self.render_netrun_tab(ui),
                Tab::Deck   => self.render_deck_tab(ui),
            }

            // ── Glitch overlay (all tabs) ─────────────────────────────────────
            let rect = ui.clip_rect();
            self.glitch.paint(ui.painter(), rect, ctx);
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
        println!("[CL4W]: Starting Headless Cyberdeck Daemon...");
        let mut app = CyberdeckApp::new(mem_path.clone());

        // ── Daemon Heartbeat — Mmap slot 4001 (byte offset 8 in heartbeat.mem) ──
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
            app.parse_radar_state();
            app.parse_hovered_unit();
            app.parse_ghost_state();

            // Write current Unix timestamp (ms) at slot 4001 (offset 8)
            let now_ms = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            hb_mmap[8..16].copy_from_slice(&now_ms.to_le_bytes());
            let _ = hb_mmap.flush_range(8, 8);

            std::thread::sleep(Duration::from_millis(16));
        }
    }

    let mut options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title(":/50V3R31GN-M4CH1N4 // HUD")
            .with_inner_size([900.0, 700.0]),
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
        ":/50V3R31GN-M4CH1N4 // HUD",
        options,
        Box::new(|_cc| Ok(Box::new(CyberdeckApp::new(mem_path)))),
    )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn make_ghost_buf(blips: &[(f32, f32, u8)]) -> Vec<u8> {
        let mut buf = Vec::new();
        buf.extend_from_slice(GHOST_MAGIC);
        buf.extend_from_slice(&(blips.len() as u32).to_le_bytes());
        for &(x, y, blip_type) in blips {
            buf.extend_from_slice(&x.to_le_bytes());
            buf.extend_from_slice(&y.to_le_bytes());
            buf.push(blip_type);
        }
        buf
    }

    #[test]
    fn test_ghost_blip_magic_check() {
        let mut bad = make_ghost_buf(&[(0.5, 0.5, BLIP_COVER)]);
        bad[0] = b'X';
        bad[1] = b'X';
        assert_eq!(parse_ghost_blips(&bad).len(), 0);
    }

    #[test]
    fn test_ghost_blip_parse_count() {
        let buf = make_ghost_buf(&[(0.25, 0.75, BLIP_COVER), (0.80, 0.10, BLIP_HAZARD)]);
        let result = parse_ghost_blips(&buf);
        assert_eq!(result.len(), 2);
        assert!((result[0].x - 0.25).abs() < 1e-5);
        assert_eq!(result[0].blip_type, BLIP_COVER);
        assert!((result[1].x - 0.80).abs() < 1e-5);
        assert_eq!(result[1].blip_type, BLIP_HAZARD);
    }

    #[test]
    fn test_ghost_blip_truncated_header() {
        let truncated = vec![0u8; GHOST_HEADER_SIZE - 1];
        assert_eq!(parse_ghost_blips(&truncated).len(), 0);
    }

    #[test]
    fn test_ghost_blip_count_exceeds_data() {
        let mut buf = vec![0u8; GHOST_HEADER_SIZE + 2 * GHOST_BLIP_SIZE];
        buf[0..16].copy_from_slice(GHOST_MAGIC);
        buf[16..20].copy_from_slice(&5u32.to_le_bytes());
        for i in 0..2usize {
            let base = GHOST_HEADER_SIZE + i * GHOST_BLIP_SIZE;
            buf[base..base + 4].copy_from_slice(&(0.1f32 * i as f32).to_le_bytes());
            buf[base + 4..base + 8].copy_from_slice(&(0.2f32 * i as f32).to_le_bytes());
            buf[base + 8] = BLIP_COVER;
        }
        assert_eq!(parse_ghost_blips(&buf).len(), 2);
    }

    #[test]
    fn test_iso_to_screen_origin() {
        let result = iso_to_screen(0, 0, 64.0, 32.0, Pos2::ZERO);
        assert_eq!(result, Pos2::ZERO);
    }

    #[test]
    fn test_iso_to_screen_col_offset() {
        let result = iso_to_screen(1, 0, 64.0, 32.0, Pos2::ZERO);
        assert!((result.x - 32.0).abs() < 1e-5, "x={}", result.x);
        assert!((result.y - 16.0).abs() < 1e-5, "y={}", result.y);
    }

    #[test]
    fn test_iso_to_screen_row_offset() {
        let result = iso_to_screen(0, 1, 64.0, 32.0, Pos2::ZERO);
        assert!((result.x - (-32.0)).abs() < 1e-5, "x={}", result.x);
        assert!((result.y - 16.0).abs() < 1e-5, "y={}", result.y);
    }

    #[test]
    fn test_iso_symmetry() {
        let col_only = iso_to_screen(3, 0, 64.0, 32.0, Pos2::ZERO);
        let row_only = iso_to_screen(0, 3, 64.0, 32.0, Pos2::ZERO);
        assert!((col_only.y - row_only.y).abs() < 1e-5);
        assert!((col_only.x + row_only.x).abs() < 1e-5);
    }

    #[test]
    fn test_default_ice_nodes_has_all_types() {
        let nodes = CyberdeckApp::default_ice_nodes();
        assert!(nodes.len() >= 5);
        assert!(nodes.iter().any(|n| n.ice_type == IceType::Firewall));
        assert!(nodes.iter().any(|n| n.ice_type == IceType::Trace));
        assert!(nodes.iter().any(|n| n.ice_type == IceType::Gate));
    }
}
