import fs from 'node:fs';
import path from 'node:path';

const PLAN_PATH = 'IMPLEMENTATION_PLAN.md';

function generateKanban() {
  const markdown = fs.readFileSync(PLAN_PATH, 'utf8');
  const lines = markdown.split('\n');
  
  const done: string[] = [];
  const inProgress: string[] = [];
  const backlog: string[] = [];
  
  let currentPhase = '';
  let currentPhaseState: 'COMPLETED' | 'IN-PROGRESS' | 'STAGED' = 'STAGED';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Phase header - matches ## <emoji> PHASE <number>: <title> (<status>)
    const phaseMatch = trimmed.match(/^##\s+([^\s]+)\s+(PHASE\s+[\d.]+.*?)(?:\((.*?)\))?$/i);
    if (phaseMatch) {
      currentPhase = phaseMatch[2].trim().replace(/:$/, '');
      const statusText = (phaseMatch[3] ?? '').toUpperCase();
      const emoji = phaseMatch[1];

      if (statusText.includes('COMPLETED') || emoji === '✅') {
        currentPhaseState = 'COMPLETED';
      } else if (statusText.includes('IN-PROGRESS') || statusText.includes('PRIMARY') || ['🛠️', '🛡️', '🧠', '📱', '🌘'].includes(emoji)) {
        currentPhaseState = 'IN-PROGRESS';
      } else {
        currentPhaseState = 'STAGED';
      }
      continue;
    }

    // Task line
    const taskMatch = trimmed.match(/^- \[(x| )\]\s+\*\*(Task\s+\d+):\s+(.*?)\*\*(.*)$/i);
    if (taskMatch && currentPhase) {
      const isDone = taskMatch[1].toLowerCase() === 'x';
      const taskText = `[${currentPhase}] ${taskMatch[2]}: ${taskMatch[3].trim()}`;
      
      if (isDone) {
        done.push(`- [x] ${taskText}`);
      } else if (currentPhaseState === 'IN-PROGRESS') {
        inProgress.push(`- [ ] ${taskText}`);
      } else if (currentPhaseState === 'STAGED') {
        backlog.push(`- [ ] ${taskText}`);
      }
    }
  }

  // Limit counts to keep it clean
  const kanban = `---

kanban-plugin: basic

---

## DONE

${done.slice(-20).reverse().join('\n')}

## IN-PROGRESS

${inProgress.join('\n')}

## BACKLOG

${backlog.slice(0, 20).join('\n')}

%% kanban:settings
\`\`\`
{"kanban-plugin":"basic"}
\`\`\`
%%`;

  return kanban;
}

console.log(generateKanban());
