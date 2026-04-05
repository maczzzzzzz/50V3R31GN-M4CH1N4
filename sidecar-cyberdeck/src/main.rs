use eframe::egui;
use egui::{CentralPanel, Color32};

mod glitch;

#[derive(PartialEq)]
enum Tab {
    Atlas,
    Netrun,
    Hacks,
}

struct CyberdeckApp {
    active_tab: Tab,
    intrusion_level: f32,
}

impl eframe::App for CyberdeckApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        CentralPanel::default().show(ctx, |ui| {
            ui.horizontal(|ui| {
                ui.selectable_value(&mut self.active_tab, Tab::Atlas, "ATLAS");
                ui.selectable_value(&mut self.active_tab, Tab::Netrun, "NETRUN");
                ui.selectable_value(&mut self.active_tab, Tab::Hacks, "HACKS");
            });
            match self.active_tab {
                Tab::Atlas => {
                    ui.label("Atlas Content");
                }
                Tab::Netrun => {
                    ui.label("Netrun Content");
                }
                Tab::Hacks => {
                    ui.label("Hacks Content");
                }
            }
        });
    }
}

fn main() -> eframe::Result<()> {
    let options = eframe::NativeOptions::default();
    eframe::run_native(
        "CYBERDECK HUD",
        options,
        Box::new(|_cc| {
            Ok(Box::new(CyberdeckApp {
                active_tab: Tab::Atlas,
                intrusion_level: 0.0,
            }))
        }),
    )
}
