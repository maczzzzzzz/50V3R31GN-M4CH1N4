import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * SOVEREIGN THEME STATE MACHINE
 * ----------------------------
 * This script now serves as the source of truth for the "Total Red Shift".
 * It contains the CSS/JS payloads that will be injected into Foundry VTT
 * via the CDP bridge to establish visual dominance.
 */

const SOVEREIGN_RED = '#ff003c';
const SOVEREIGN_BLACK = '#000000';

const SOVEREIGN_THEME_CSS = `
/* SOVEREIGN DOMINANCE LAYER */
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

:root {
    --cpr-red: ${SOVEREIGN_RED};
    --cpr-black: ${SOVEREIGN_BLACK};
    --font-primary: 'VT323', monospace;
}

body.vtt, .app, .window-app {
    background: var(--cpr-black) !important;
    color: var(--cpr-red) !important;
    font-family: var(--font-primary) !important;
    text-shadow: 0 0 5px rgba(255, 0, 60, 0.5);
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

/* UI GLITCH OVERLAYS */
#sovereign-scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
        transparent 0px,
        rgba(255, 0, 60, 0.05) 1px,
        transparent 3px
    );
    z-index: 9999;
}
`;

const SOVEREIGN_HIJACK_JS = `
(function() {
    console.log("::/5Y573M-N071C3 : GH0S7-PR070C0L 4C71V473D");

    // 1. 1337-5P34K MUTATION ENGINE
    const LEET_MAP = { 'A': '4', 'E': '3', 'I': '1', 'O': '0', 'S': '5', 'T': '7', 'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7' };
    const toLeet = (text) => text.split('').map(c => LEET_MAP[c] || c).join('');

    const mutateText = (node) => {
        if (node.nodeType === Node.TEXT_NODE && node.parentElement && !['SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA'].includes(node.parentElement.tagName)) {
            const original = node.textContent;
            const leet = toLeet(original);
            if (original !== leet) node.textContent = leet;
        } else {
            for (const child of node.childNodes) mutateText(child);
        }
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) mutateText(node);
        }
    });

    // 2. HARD OVERWRITE GLITCH (BOOT SEQUENCE)
    const triggerGlitch = () => {
        const body = document.body;
        body.style.transition = "filter 0.05s linear";
        
        let frames = 0;
        const interval = setInterval(() => {
            const h = Math.random() * 40 - 20;
            const c = 1.5 + Math.random();
            const b = 1.2 + Math.random();
            body.style.filter = \`hue-rotate(\${h}deg) contrast(\${c}) brightness(\${b})\`;
            
            if (frames++ > 15) {
                clearInterval(interval);
                body.style.filter = "none";
                body.style.transition = "none";
                
                // Final stabilization
                const style = document.createElement('style');
                style.textContent = \`${SOVEREIGN_THEME_CSS}\`;
                document.head.appendChild(style);
                
                const scan = document.createElement('div');
                scan.id = 'sovereign-scanlines';
                document.body.appendChild(scan);

                // Start Leet monitoring
                mutateText(document.body);
                observer.observe(document.body, { childList: true, subtree: true });
            }
        }, 40);
    };

    if (game.ready) triggerGlitch();
    else Hooks.once("ready", triggerGlitch);
})();
`;

// Original replacement logic preserved for CLI/Sidecar files
const REPLACEMENTS = [
  { regex: /#00f3ff/gi, replacement: '#ff003c' },
  { regex: /0x00,\s*0xf3,\s*0xff/gi, replacement: '0xff, 0x00, 0x3c' },
  { regex: /var\(--cpr-cyan\)/gi, replacement: 'var(--cpr-red)' },
  { regex: /0,\s*243,\s*255/gi, replacement: '255, 0, 60' },
  { regex: /colorCyan/g, replacement: 'colorRed' },
  { regex: /CYAN/g, replacement: 'RED' }
];

function processFile(filePath: string) {
  let content = readFileSync(filePath, 'utf-8');
  let originalContent = content;

  content = content.replace(/colorCyan\s*=\s*lipgloss\.Color\(".*?"\)/g, 'colorRed = lipgloss.Color("#ff003c")');
  content = content.replace(/const CYAN:\s*Color32\s*=\s*Color32::from_rgb\(.*?\);/g, 'const RED: Color32 = Color32::from_rgb(0xff, 0x00, 0x3c);');

  for (const { regex, replacement } of REPLACEMENTS) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`[theme-sync] Updated: ${filePath}`);
  }
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: tsx scripts/theme-sync.ts <file1> <file2> ...');
  // If no files, we print the JS payload for direct injection testing
  console.log('\n--- SOVEREIGN HIJACK PAYLOAD ---');
  console.log(SOVEREIGN_HIJACK_JS);
} else {
  for (const file of files) {
    processFile(file);
  }
}

