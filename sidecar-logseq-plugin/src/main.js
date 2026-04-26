/**
 * LOGSEQ_SOVEREIGN_MESH : v1.0.0
 * 
 * Native Logseq integration for Datalog agentic memory and Shared Shard synchronization.
 */

async function main() {
    console.log(">> [SOVEREIGN] Logseq Mesh Artery Ignited.");

    // 1. Register "Sovereign Search" Command
    logseq.Editor.registerSlashCommand('Sovereign Query', async () => {
        const query = await logseq.Editor.getEditingBlockContent();
        console.log(`>> [SOVEREIGN] Relaying Datalog Query: ${query}`);
        // Relay to local crush bridge via fetch
        fetch('http://localhost:12315/api', {
            method: 'POST',
            body: JSON.stringify({ method: 'logseq.DB.datascriptQuery', args: [query] })
        });
    });

    // 2. Automated Meeting Tagging
    logseq.DB.onChanged(async (e) => {
        if (e.txData && e.txData.some(t => t[2] && t[2].toString().includes("SOVEREIGN_HALL_MEETING"))) {
            console.log("◈ [SOVEREIGN] Meeting block detected. Applying structural tags.");
            // Logic to add #OPEN or #RESOLVED tags based on system state
        }
    });

    // 3. UI Overlay (Vitals + Highlights)
    logseq.provideUI({
        key: 'sovereign-dashboard',
        path: '#head .right',
        template: `
            <div style="display: flex; align-items: center; font-family: monospace;">
                <div style="color: #ff003c; margin-right: 15px; cursor: pointer;" onclick="window.fetchHighlights()">◈ 50V</div>
                <div style="color: #fabd2f; font-size: 10px;">[REPUTATION_MODE]</div>
            </div>
        `
    });

    // 4. Highlight Fetch Relay
    window.fetchHighlights = async () => {
        console.log(">> [SOVEREIGN] Fetching Logseq Highlights...");
        const res = await fetch('http://localhost:3010/api/social/highlights');
        const data = await res.json();
        logseq.UI.showMsg(`◈ SOCIAL_HIGHLIGHTS: ${data.map(h => h.label).join(', ')}`, 'info');
    };
}

logseq.ready(main).catch(console.error);
