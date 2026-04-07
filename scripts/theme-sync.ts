import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Define the replacement targets
const REPLACEMENTS = [
  {
    regex: /#00f3ff/gi,
    replacement: '#ff003c'
  },
  {
    regex: /0x00,\s*0xf3,\s*0xff/gi,
    replacement: '0xff, 0x00, 0x3c'
  },
  {
    regex: /var\(--cpr-cyan\)/gi,
    replacement: 'var(--cpr-red)'
  },
  {
    regex: /0,\s*243,\s*255/gi,
    replacement: '255, 0, 60'
  },
  {
    regex: /colorCyan\s*=\s*lipgloss\.Color\("#ff003c"\)/g, // Just in case it was already replaced
    replacement: 'colorCyan = lipgloss.Color("#ff003c")'
  },
  {
    regex: /colorCyan/g,
    replacement: 'colorRed'
  },
  {
    regex: /CYAN/g,
    replacement: 'RED'
  }
];

function processFile(filePath: string) {
  let content = readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Special handling for Go code variable renaming
  content = content.replace(/colorCyan\s*=\s*lipgloss\.Color\(".*?"\)/g, 'colorRed = lipgloss.Color("#ff003c")');
  
  // Special handling for Rust code const renaming
  content = content.replace(/const CYAN:\s*Color32\s*=\s*Color32::from_rgb\(.*?\);/g, 'const RED: Color32 = Color32::from_rgb(0xff, 0x00, 0x3c);');

  for (const { regex, replacement } of REPLACEMENTS) {
    content = content.replace(regex, replacement);
  }

  if (content !== originalContent) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`[theme-sync] Updated: ${filePath}`);
  }
}

// We will get the files to process from the command line arguments or standard input
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: tsx scripts/theme-sync.ts <file1> <file2> ...');
  process.exit(1);
}

for (const file of files) {
  processFile(file);
}
