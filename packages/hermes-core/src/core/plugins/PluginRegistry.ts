/**
 * PLUGIN_REGISTRY : v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS (Sovereign Ecosystem)
 * 
 * Manages decoupled integrations (Obsidian, Logseq, Flutter) using an 
 * Omi-inspired capability manifest.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";
import { PluginManifestSchema, type PluginManifest } from "../../plugins/PluginManifest.js";

export interface LegacyPluginManifest {
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
    private legacyPlugins: Map<string, LegacyPluginManifest> = new Map();
    private declarativePlugins: Map<string, PluginManifest> = new Map();

    /**
     * Registers a new legacy plugin shored in the mesh.
     */
    public register(manifest: LegacyPluginManifest): void {
        console.log(`◈ [PLUGIN] Registering Legacy: ${manifest.name} (v${manifest.version})`);
        this.legacyPlugins.set(manifest.id, manifest);
    }

    /**
     * Registers a new declarative plugin.
     */
    public registerDeclarative(manifest: PluginManifest): void {
        console.log(`◈ [PLUGIN] Provisioning Sidecar: ${manifest.name} (v${manifest.version}) [${manifest.spiffe_id}]`);
        this.declarativePlugins.set(manifest.name, manifest);
        
        // In a real implementation, this would trigger the actual process provisioning.
        // For Phase 107 Task 2, we are establishing the framework.
    }

    /**
     * Scans the provided directory for manifest.yaml files.
     */
    public scan(pluginsDir: string): void {
        if (!existsSync(pluginsDir)) {
            console.warn(`◈ [PLUGIN] Scan directory not found: ${pluginsDir}`);
            return;
        }

        const entries = readdirSync(pluginsDir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const manifestPath = join(pluginsDir, entry.name, "manifest.yaml");
                if (existsSync(manifestPath)) {
                    try {
                        const content = readFileSync(manifestPath, "utf8");
                        const raw = yaml.load(content);
                        const manifest = PluginManifestSchema.parse(raw);
                        this.registerDeclarative(manifest);
                    } catch (e) {
                        console.error(`◈ [PLUGIN] Failed to load manifest at ${manifestPath}:`, e);
                    }
                }
            }
        }
    }

    /**
     * Retrieves a legacy plugin by ID.
     */
    public getLegacy(id: string): LegacyPluginManifest | undefined {
        return this.legacyPlugins.get(id);
    }

    /**
     * Retrieves a declarative plugin by name.
     */
    public getDeclarative(name: string): PluginManifest | undefined {
        return this.declarativePlugins.get(name);
    }

    /**
     * Lists all shored plugins (legacy and declarative).
     */
    public list(): (LegacyPluginManifest | PluginManifest)[] {
        return [
            ...Array.from(this.legacyPlugins.values()),
            ...Array.from(this.declarativePlugins.values())
        ];
    }
}

// ── Canonical Plugins ─────────────────────────────────────────────────────────

export const OBSIDIAN_PLUGIN_MANIFEST: LegacyPluginManifest = {
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

export const LOGSEQ_PLUGIN_MANIFEST: LegacyPluginManifest = {
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

