import { GauntletEngine } from '../engine';
import { TestStatus } from '../types';

/**
 * GAUNTLET TEST: Phase 73 — Physical Sociotomy
 * 
 * Objectives:
 * 1. Verify Cold Shard (Archive) is physically decoupled from Hot Shard.
 * 2. Verify Obsidian exclusion rules are active.
 * 3. Verify Semantic Retrieval Bridge connectivity.
 */

export async function testPhase73(engine: GauntletEngine): Promise<TestStatus> {
    engine.log("◈ [GAUNTLET] Testing Phase 73: Physical Sociotomy...");

    // 1. Physical Decoupling Check
    const archivePath = "/mnt/d/Obsidian_CPR_ColdStorage/Lore";
    const hotPath = "data/vault/RKG/Global/Lore";
    
    const archiveExists = await engine.checkPath(archivePath);
    const hotEmpty = (await engine.countFiles(hotPath)) === 0;

    if (!archiveExists || !hotEmpty) {
        return { status: 'FAILED', reason: "Physical sharding failure: Hot vault still contains lore shards." };
    }

    // 2. Logical Exclusion Check
    const appJson = await engine.readJson("data/vault/RKG/.obsidian/app.json");
    const isExcluded = appJson.userExcludedFolders?.includes("RKG_Archive");

    if (!isExcluded) {
        return { status: 'FAILED', reason: "Logical exclusion failure: Obsidian app.json missing RKG_Archive rule." };
    }

    // 3. Bridge Connectivity Check
    const bridgeResult = await engine.exec("bun scripts/dev/query-cold-lore.ts 'Militech'");
    if (!bridgeResult.includes("BRIDGE")) {
        return { status: 'FAILED', reason: "Bridge failure: query-cold-lore.ts not functional." };
    }

    return { status: 'SUCCESS' };
}
