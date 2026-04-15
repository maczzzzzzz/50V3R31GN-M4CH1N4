/**
 * src/core/sovereign-theme.ts
 *
 * Source of truth for the "Total Red Shift" visual dominance layer.
 * Contains CSS and JS payloads for injection into Foundry VTT via CDP.
 */

export const SOVEREIGN_RED = '#ff003c';
export const SOVEREIGN_BLACK = '#000000';

export const SOVEREIGN_THEME_CSS = `
/* SOVEREIGN DOMINANCE LAYER */
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

:root {
    --cpr-red: ${SOVEREIGN_RED};
    --cpr-black: ${SOVEREIGN_BLACK};
    --font-primary: 'VT323', monospace;
}

/* Global Core */
body.vtt, .app, .window-app, #chat-log, #sidebar, #controls {
    background: var(--cpr-black) !important;
    color: var(--cpr-red) !important;
    font-family: var(--font-primary) !important;
}

/* Fix White Backgrounds in Sheets & Editors (Foundry v12 / ProseMirror) */
.sheet, .journal-entry, .item-sheet, .actor-sheet, .journal-sheet,
.journal-entry-page, .journal-page-content, .journal-entry-content,
.prosemirror, .ProseMirror, .editor-content, .window-content, .tab-content,
.item-sheet .sheet-body, .sheet .sheet-body {
    background-color: var(--cpr-black) !important;
    background-image: none !important;
    color: var(--cpr-red) !important;
}

/* ProseMirror rich-text node overrides (Foundry v12 replaced TinyMCE) */
.ProseMirror p, .ProseMirror li, .ProseMirror blockquote,
.ProseMirror h1, .ProseMirror h2, .ProseMirror h3 {
    background-color: transparent !important;
    color: var(--cpr-red) !important;
}

/* Target tables and specific CPR system elements */
table, tr, td, th, .cpr-sheet, .cpr-control, .item-list, .attributes {
    background: transparent !important;
    border-color: var(--cpr-red) !important;
    color: var(--cpr-red) !important;
}

.window-app .window-header {
    background: #1a0000 !important;
    border-bottom: 1px solid var(--cpr-red) !important;
}

button, input, select, textarea {
    background: #050505 !important;
    color: var(--cpr-red) !important;
    border: 1px solid var(--cpr-red) !important;
    font-family: var(--font-primary) !important;
}

/* UI GLITCH OVERLAYS - More Translucent */
#sovereign-scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
        transparent 0px,
        rgba(255, 0, 60, 0.02) 1px,
        transparent 3px
    );
    z-index: 9999;
    opacity: 0.6;
}
`;

export const SOVEREIGN_HIJACK_JS = `
(function() {
    console.log("::/5Y573M-N071C3 : GH0S7-PR070C0L 4C71V473D");
    
    // Global hack state
    window.HACK_ACTIVE = false;

    // 1. 1337-5P34K MUTATION ENGINE
    const LEET_MAP = { 'A': '4', 'E': '3', 'I': '1', 'O': '0', 'S': '5', 'T': '7', 'Z': '2', 'B': '8', 'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'z': '2', 'b': '8' };
    const toLeet = (text) => text.split('').map(c => LEET_MAP[c] || c).join('');

    const mutateText = (node) => {
        if (!window.HACK_ACTIVE) return;
        if (node.nodeType === Node.TEXT_NODE && node.parentElement) {
            const tag = node.parentElement.tagName;
            const isIgnored = ['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(tag) || !!node.parentElement.closest('.hp-value, .sp-value');
            if (!isIgnored) {
                const original = node.textContent;
                const leet = toLeet(original);
                if (original !== leet) node.textContent = leet;
            }
        } else {
            for (const child of node.childNodes) mutateText(child);
        }
    };

    const observer = new MutationObserver((mutations) => {
        if (!window.HACK_ACTIVE) return;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) mutateText(node);
        }
    });

    // 2. HARD OVERWRITE GLITCH (BOOT SEQUENCE)
    const triggerGlitch = () => {
        const body = document.body;
        
        // Final stabilization
        const style = document.createElement('style');
        style.id = 'sovereign-theme-overrides';
        style.textContent = \`${SOVEREIGN_THEME_CSS}\`;
        document.head.appendChild(style);
        
        if (!document.getElementById('sovereign-scanlines')) {
            const scan = document.createElement('div');
            scan.id = 'sovereign-scanlines';
            document.body.appendChild(scan);
        }

        // Start Leet monitoring (will only mutate if HACK_ACTIVE is true)
        observer.observe(document.body, { childList: true, subtree: true });
    };

    // External Trigger for Hacks
    window.setSovereignHack = (active) => {
        window.HACK_ACTIVE = active;
        if (active) {
            mutateText(document.body);
            console.log("::/5Y573M-N071C3 : H4CK-M0D3 3N48L3D");
        } else {
            console.log("::/5Y573M-N071C3 : H4CK-M0D3 D1548L3D");
            // Note: reverting leet speak is hard without reloading, we accept it for now
        }
    };

    if (typeof game !== 'undefined' && game.ready) triggerGlitch();
    else if (typeof Hooks !== 'undefined') Hooks.once("ready", triggerGlitch);
})();
`;
