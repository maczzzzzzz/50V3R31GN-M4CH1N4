/**
 * PLUGIN_REGISTRY : v3.8.7 (Sovereign Ecosystem)
 * 
 * Manages decoupled integrations (Obsidian, Logseq, Flutter) using an 
 * Omi-inspired capability manifest.
 */

export interface PluginManifest {
    id: string;
    name: string;
    description: string;
    author: string;
    version: string;
    endpoints: {
        query?: string;
        stream?: string;
        action?: string;
    };
    capabilities: string[]; // ["MEMORY_READ", "MEMORY_WRITE", "HUD_NOTIFY", "SPATIAL_PROJECTION"]
}

export class PluginRegistry {
    private plugins: Map<string, PluginManifest> = new Map();

    /**
     * Registers a new plugin shored in the mesh.
     */
    public register(manifest: PluginManifest): void {
        console.log(`◈ [PLUGIN] Registering: ${manifest.name} (v${manifest.version})`);
        this.plugins.set(manifest.id, manifest);
    }

    /**
     * Retrieves a plugin by ID.
     */
    public get(id: string): PluginManifest | undefined {
        return this.plugins.get(id);
    }

    /**
     * Lists all shored plugins.
     */
    public list(): PluginManifest[] {
        return Array.from(this.plugins.values());
    }
}

// ── Canonical Plugins ─────────────────────────────────────────────────────────

export const OBSIDIAN_PLUGIN_MANIFEST: PluginManifest = {
    id: "obsidian-sovereign-bridge",
    name: "Obsidian Sovereign Bridge",
    description: "Native Obsidian integration for physical vault synchronization and HUD overlays.",
    author: "50V3R31GN-M4CH1N4",
    version: "1.0.0",
    endpoints: {
        query: "/api/obsidian/query",
        action: "/api/obsidian/action"
    },
    capabilities: ["MEMORY_READ", "MEMORY_WRITE", "HUD_NOTIFY"]
};

export const LOGSEQ_PLUGIN_MANIFEST: PluginManifest = {
    id: "logseq-sovereign-mesh",
    name: "Logseq Sovereign Mesh",
    description: "Native Logseq integration for Datalog agentic memory and Shared Shard synchronization.",
    author: "50V3R31GN-M4CH1N4",
    version: "1.0.0",
    endpoints: {
        query: "/api/logseq/query",
        stream: "/api/logseq/stream"
    },
    capabilities: ["MEMORY_READ", "MEMORY_WRITE", "SPATIAL_PROJECTION"]
};
