/**
 * src/core/plugins/PluginRegistry.ts
 *
 * Phase 85.2 — Sovereign Plugin Artery
 *
 * Implements a decoupled registry for external context providers and integrations.
 * Allows 'Apps' (Logseq, Obsidian, WhatsApp) to register as sidecar plugins
 * without bloating the core LangGraphOrchestrator.
 */

export interface SovereignPlugin {
  id: string;
  name: string;
  version: string;
  capabilities: ('query' | 'stream' | 'action')[];
  onEnable(): Promise<void>;
  onDisable(): Promise<void>;
}

export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, SovereignPlugin> = new Map();

  private constructor() {}

  public static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  public register(plugin: SovereignPlugin) {
    console.log(`◈ [PLUGIN] Registering: ${plugin.name} v${plugin.version}`);
    this.plugins.set(plugin.id, plugin);
  }

  public getPlugin(id: string): SovereignPlugin | undefined {
    return this.plugins.get(id);
  }

  public listPlugins(): SovereignPlugin[] {
    return Array.from(this.plugins.values());
  }
}
