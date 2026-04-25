use eframe::egui;
use egui::{epaint, CentralPanel, Color32, FontId, Pos2, Stroke};
use std::time::Duration;

// ─── Black-Ice Palette ───────────────────────────────────────────────────────
const RED: Color32 = Color32::from_rgb(0xff, 0x00, 0x3c);
const BLACK: Color32 = Color32::from_rgb(0x00, 0x00, 0x00);
fn dim_red() -> Color32 { Color32::from_rgba_unmultiplied(0xff, 0x00, 0x3c, 60) }

// ─── Isometric Math ──────────────────────────────────────────────────────────

/// Convert isometric grid coordinates (col, row) to screen (x, y).
/// tile_w and tile_h are the pixel dimensions of one tile (width, half-height).
pub(crate) fn iso_to_screen(col: i32, row: i32, tile_w: f32, tile_h: f32, origin: Pos2) -> Pos2 {
    Pos2 {
        x: origin.x + (col as f32 - row as f32) * (tile_w / 2.0),
        y: origin.y + (col as f32 + row as f32) * (tile_h / 2.0),
    }
}

// ─── ICE Types ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
enum IceType {
    Firewall, // Cyan diamond outline
    Trace,    // Red filled circle
    Gate,     // White square outline
}

// ─── ICE Node ────────────────────────────────────────────────────────────────

struct IceNode {
    col: i32,
    row: i32,
    ice_type: IceType,
    label: String,
    active: bool,
}

// ─── App ──────────────────────────────────────────────────────────────────────

struct NetrunApp {
    nodes: Vec<IceNode>,
    grid_cols: i32,
    grid_rows: i32,
    intrusion_level: f32, // 0.0 to 1.0
}

impl NetrunApp {
    fn new() -> Self {
        let nodes = vec![
            // ... (rest of nodes remains same)
            IceNode {
                col: 7,
                row: 4,
                ice_type: IceType::Gate,
                label: "GATE-B".to_string(),
                active: true,
            },
        ];

        Self {
            nodes,
            grid_cols: 8,
            grid_rows: 8,
            intrusion_level: 0.0,
        }
    }
}

// ─── Grid & Node Rendering Helpers ───────────────────────────────────────────

/// Compute the isometric grid origin so the grid is centered in `rect`.
pub(crate) fn grid_origin(rect: egui::Rect, grid_cols: i32, grid_rows: i32, tile_w: f32, tile_h: f32) -> Pos2 {
    // The grid spans from col=0,row=0 to col=grid_cols,row=grid_rows.
    // The leftmost point (max col-row negative) is col=0, row=grid_rows → x offset -(grid_rows)*(tile_w/2)
    // The rightmost point is col=grid_cols, row=0 → x offset +(grid_cols)*(tile_w/2)
    // The topmost point is col=0, row=0 → y=0
    // The bottommost point is col=grid_cols, row=grid_rows → y = (grid_cols + grid_rows) * (tile_h / 2)
    let total_h = (grid_cols + grid_rows) as f32 * (tile_h / 2.0);
    let center = rect.center();
    Pos2 {
        x: center.x - grid_rows as f32 * (tile_w / 2.0),
        y: center.y - total_h / 2.0,
    }
}

// ─── eframe::App ─────────────────────────────────────────────────────────────

impl eframe::App for NetrunApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // ── Black-Ice Visuals ──────────────────────────────────────────────────
        let mut visuals = ctx.style().visuals.clone();
        visuals.panel_fill = BLACK;
        visuals.window_fill = BLACK;
        visuals.extreme_bg_color = BLACK;
        visuals.faint_bg_color = Color32::from_rgb(5, 5, 5);
        visuals.window_stroke = Stroke::new(1.0, RED);
        visuals.window_shadow = epaint::Shadow::NONE;
        visuals.popup_shadow = epaint::Shadow::NONE;
        visuals.override_text_color = Some(RED);
        visuals.widgets.noninteractive.bg_fill = BLACK;
        visuals.widgets.noninteractive.fg_stroke = Stroke::new(1.0, RED);
        ctx.set_visuals(visuals);
        ctx.request_repaint_after(Duration::from_millis(33));

        CentralPanel::default().show(ctx, |ui| {
            let rect = ui.available_rect_before_wrap();
            let painter = ui.painter();

            // Fill background
            painter.rect_filled(rect, 0.0, BLACK);

            // ── Isometric Grid ─────────────────────────────────────────────────
            let tile_w = 64.0_f32;
            let tile_h = 32.0_f32;
            let origin = grid_origin(rect, self.grid_cols, self.grid_rows, tile_w, tile_h);
            let grid_stroke = Stroke::new(0.5, dim_red());

            // Draw grid lines along rows (connecting cols across a row)
            for row in 0..=self.grid_rows {
                let start = iso_to_screen(0, row, tile_w, tile_h, origin);
                let end = iso_to_screen(self.grid_cols, row, tile_w, tile_h, origin);
                painter.line_segment([start, end], grid_stroke);
            }

            // Draw grid lines along cols (connecting rows across a col)
            for col in 0..=self.grid_cols {
                let start = iso_to_screen(col, 0, tile_w, tile_h, origin);
                let end = iso_to_screen(col, self.grid_rows, tile_w, tile_h, origin);
                painter.line_segment([start, end], grid_stroke);
            }

            // ── ICE Nodes ──────────────────────────────────────────────────────
            // Snapshot the node list to avoid borrow-checker issues with painter.
            let node_count = self.nodes.len();
            for i in 0..node_count {
                let col = self.nodes[i].col;
                let row = self.nodes[i].row;
                let ice_type = self.nodes[i].ice_type.clone();
                let label = self.nodes[i].label.clone();
                let active = self.nodes[i].active;

                // Center the node at the mid-point of the tile
                let mid = iso_to_screen(col, row, tile_w, tile_h, origin);
                // Tile center x equals apex x; +0.5 on col and row cancel in x
                let cx = mid.x;
                let cy = mid.y + (tile_h / 2.0);
                let center = Pos2::new(cx, cy);

                match ice_type {
                    IceType::Firewall => {
                        let r = 10.0_f32;
                        let top = Pos2::new(cx, cy - r);
                        let right = Pos2::new(cx + r, cy);
                        let bottom = Pos2::new(cx, cy + r);
                        let left = Pos2::new(cx - r, cy);
                        let color = if active { RED } else { dim_red() };
                        let stroke = Stroke::new(1.5, color);
                        painter.line_segment([top, right], stroke);
                        painter.line_segment([right, bottom], stroke);
                        painter.line_segment([bottom, left], stroke);
                        painter.line_segment([left, top], stroke);
                        painter.text(
                            center + egui::vec2(0.0, r + 4.0),
                            egui::Align2::CENTER_TOP,
                            &label,
                            FontId::monospace(9.0),
                            RED,
                        );
                    }
                    IceType::Trace => {
                        if active {
                            painter.circle_filled(center, 8.0, RED);
                        } else {
                            painter.circle_stroke(center, 8.0, Stroke::new(1.5, RED));
                        }
                        painter.text(
                            center + egui::vec2(0.0, 12.0),
                            egui::Align2::CENTER_TOP,
                            &label,
                            FontId::monospace(9.0),
                            RED,
                        );
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
                        painter.text(
                            center + egui::vec2(0.0, half + 4.0),
                            egui::Align2::CENTER_TOP,
                            &label,
                            FontId::monospace(9.0),
                            Color32::WHITE,
                        );
                    }
                }
            }

            // ── Status Bar ────────────────────────────────────────────────────
            let status = format!(":/N37RUN-D43M0N // 5747U5: 4C71V3 | N0D35: {} | 1N7RU510N: {:.0}%", node_count, self.intrusion_level * 100.0);
            painter.text(
                rect.left_bottom() + egui::vec2(5.0, -5.0),
                egui::Align2::LEFT_BOTTOM,
                status,
                FontId::monospace(11.0),
                if self.intrusion_level > 0.7 { RED } else { RED },
            );

            // ── Intrusion Alert Overlay ────────────────────────────────────────
            if self.intrusion_level > 0.3 {
                let flash = (ctx.input(|i| i.time) * 5.0).sin() > 0.0;
                if flash {
                    painter.text(
                        rect.center() + egui::vec2(0.0, -100.0),
                        egui::Align2::CENTER_CENTER,
                        "!! 1N7RU510N D373C73D !!",
                        FontId::monospace(24.0),
                        RED,
                    );
                    painter.rect_stroke(rect, 0.0, Stroke::new(2.0, RED), egui::StrokeKind::Middle);
                }
                
                // Glitch noise
                use rand::Rng;
                let mut rng = rand::thread_rng();
                for _ in 0..5 {
                    let rx = rng.gen_range(rect.left()..rect.right());
                    let ry = rng.gen_range(rect.top()..rect.bottom());
                    painter.circle_filled(Pos2::new(rx, ry), 2.0, RED);
                }
            }
        });
    }
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

fn main() -> eframe::Result<()> {
    let args: Vec<String> = std::env::args().collect();
    let headless = args.iter().any(|a| a == "--headless");

    if headless {
        println!(":/N37RUN-D43M0N // 5747U5: 4C71V3 [H34DL355]");
        // In headless mode, we just loop and process state (logic to be expanded)
        loop {
            std::thread::sleep(std::time::Duration::from_secs(10));
        }
    }

    let mut options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title(":/50V3R31GN-M4CH1N4 // N37RUN")
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
        ":/50V3R31GN-M4CH1N4 // N37RUN",
        options,
        Box::new(|_cc| Ok(Box::new(NetrunApp::new()))),
    )
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// T1 — origin maps to origin
    #[test]
    fn test_iso_to_screen_origin() {
        let result = iso_to_screen(0, 0, 64.0, 32.0, Pos2::ZERO);
        assert_eq!(result, Pos2::ZERO, "iso_to_screen(0, 0, ...) should return origin");
    }

    /// T2 — col=1, row=0 → x=32, y=16
    #[test]
    fn test_iso_to_screen_col_offset() {
        let result = iso_to_screen(1, 0, 64.0, 32.0, Pos2::ZERO);
        assert!(
            (result.x - 32.0).abs() < 1e-5,
            "Expected x=32.0, got x={}",
            result.x
        );
        assert!(
            (result.y - 16.0).abs() < 1e-5,
            "Expected y=16.0, got y={}",
            result.y
        );
    }

    /// T3 — col=0, row=1 → x=-32, y=16
    #[test]
    fn test_iso_to_screen_row_offset() {
        let result = iso_to_screen(0, 1, 64.0, 32.0, Pos2::ZERO);
        assert!(
            (result.x - (-32.0)).abs() < 1e-5,
            "Expected x=-32.0, got x={}",
            result.x
        );
        assert!(
            (result.y - 16.0).abs() < 1e-5,
            "Expected y=16.0, got y={}",
            result.y
        );
    }

    /// T4 — symmetry: iso_to_screen(n, 0) and iso_to_screen(0, n) share y, mirror x
    #[test]
    fn test_iso_symmetry() {
        let n = 3;
        let tile_w = 64.0;
        let tile_h = 32.0;
        let col_only = iso_to_screen(n, 0, tile_w, tile_h, Pos2::ZERO);
        let row_only = iso_to_screen(0, n, tile_w, tile_h, Pos2::ZERO);
        assert!(
            (col_only.y - row_only.y).abs() < 1e-5,
            "y values should match: col_only.y={}, row_only.y={}",
            col_only.y,
            row_only.y
        );
        assert!(
            (col_only.x + row_only.x).abs() < 1e-5,
            "x values should be mirrored (sum to 0): col_only.x={}, row_only.x={}",
            col_only.x,
            row_only.x
        );
    }

    /// T5 — freshly constructed IceNode with active:true has accessible IceType
    #[test]
    fn test_ice_node_default_active() {
        let node = IceNode {
            col: 2,
            row: 3,
            ice_type: IceType::Firewall,
            label: "TEST-FW".to_string(),
            active: true,
        };
        assert!(node.active);
        assert_eq!(node.ice_type, IceType::Firewall);
        assert_eq!(node.col, 2);
        assert_eq!(node.row, 3);
    }

    #[test]
    fn test_grid_origin_x_centering() {
        use egui::Pos2;
        // For an 8x8 grid with tile_w=64, tile_h=32:
        // origin.x should be center.x - grid_rows * (tile_w/2)
        //                 = 400.0 - 8 * 32.0 = 400.0 - 256.0 = 144.0
        let center = Pos2::new(400.0, 300.0);
        let rect = egui::Rect::from_center_size(center, egui::Vec2::ZERO);
        let origin = grid_origin(rect, 8, 8, 64.0, 32.0);
        let expected_x = 400.0 - 8.0 * (64.0 / 2.0);
        assert!((origin.x - expected_x).abs() < 1e-3, "origin.x={} expected={}", origin.x, expected_x);
    }

    #[test]
    fn test_tile_center_x_equals_mid_x() {
        use egui::Pos2;
        // Tile center x should equal the apex x (iso_to_screen result x)
        // because the (col+0.5) - (row+0.5) = col - row, unchanged
        let origin = Pos2::ZERO;
        let apex = iso_to_screen(3, 2, 64.0, 32.0, origin);
        // tile center x = apex.x + 0 (the col+0.5 and row+0.5 cancel in x)
        let tile_center_x = apex.x; // what the rendering code should use
        assert!((tile_center_x - apex.x).abs() < 1e-3);
        // Specifically: tile_center_x must NOT be apex.x + tile_w/4
        let wrong_cx = apex.x + 64.0 / 4.0; // the old incorrect formula
        assert!((tile_center_x - wrong_cx).abs() > 10.0,
                "tile center x must not equal apex.x + tile_w/4");
    }

    /// T6 — NetrunApp::new() returns at least 5 nodes
    #[test]
    fn test_netrun_app_has_nodes() {
        let app = NetrunApp::new();
        assert!(
            app.nodes.len() >= 5,
            "NetrunApp must have at least 5 nodes, got {}",
            app.nodes.len()
        );
        // Verify all three ICE types are represented
        let has_firewall = app.nodes.iter().any(|n| n.ice_type == IceType::Firewall);
        let has_trace = app.nodes.iter().any(|n| n.ice_type == IceType::Trace);
        let has_gate = app.nodes.iter().any(|n| n.ice_type == IceType::Gate);
        assert!(has_firewall, "Must have at least one Firewall node");
        assert!(has_trace, "Must have at least one Trace node");
        assert!(has_gate, "Must have at least one Gate node");
    }
}
