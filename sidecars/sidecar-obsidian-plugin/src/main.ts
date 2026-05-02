import { App, Plugin, PluginSettingTab, Setting, MarkdownView } from 'obsidian';

/**
 * OBSIDIAN_SOVEREIGN_BRIDGE : v1.0.0
 * 
 * Native Obsidian plugin for physical vault synchronization and HUD overlays.
 */

interface SovereignSettings {
	nodeBUrl: string;
}

const DEFAULT_SETTINGS: SovereignSettings = {
	nodeBUrl: 'ws://localhost:3010'
}

export default class SovereignBridge extends Plugin {
	settings: SovereignSettings;

	async onload() {
		await this.loadSettings();

		// 1. Add "Send to Sovereign Hall" Command
		this.addCommand({
			id: 'send-to-hall',
			name: 'Send Active Note to Sovereign Hall',
			callback: () => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					const content = view.getViewData();
					const fileName = view.file?.name;
					this.sendToHall(fileName, content);
				}
			}
		});

		// 2. Add Ribbon Icons
		this.addRibbonIcon('skull', 'Sovereign Sync', () => {
			this.checkSystemStatus();
		});

		this.addRibbonIcon('star', 'Sovereign Highlights', () => {
			this.openHighlights();
		});

		// 3. Status Bar Notification
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('◈ SOVEREIGN_ACTIVE');
	}

	async openHighlights() {
		console.log(">> [SOVEREIGN] Fetching Highlight Reel...");
		try {
			const response = await fetch(`${this.settings.nodeBUrl.replace('ws', 'http')}/api/social/highlights`);
			if (response.ok) {
				const highlights = await response.json();
				// Logic to render highlights in a side-pane
				// @ts-ignore
				new Notice(`◈ HIGHLIGHT_REEL: ${highlights.length} shards featured.`);
			}
		} catch (e) {
			console.error("::/ARTERY_ERROR : HIGHLIGHT_FETCH_FAILED", e);
		}
	}

	async sendToHall(file: string | undefined, content: string) {
		console.log(`>> [SOVEREIGN] Dispatching ${file} to Hall Artery...`);
		try {
			const response = await fetch(`${this.settings.nodeBUrl.replace('ws', 'http')}/api/hall/push`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ file, content })
			});
			if (response.ok) {
				// @ts-ignore
				new Notice(`✅ ${file} shored in Sovereign Hall.`);
			}
		} catch (e) {
			console.error("::/ARTERY_ERROR : HALL_DISPATCH_FAILED", e);
		}
	}

	async checkSystemStatus() {
		// Mocked status check - would query the bridge
		// @ts-ignore
		new Notice('◈ SYSTEM_STATUS: ARTERY_SECURE');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
