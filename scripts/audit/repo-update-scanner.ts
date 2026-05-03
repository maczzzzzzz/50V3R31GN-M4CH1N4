import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// 50V3R31GN-M4CH1N4 // REPO UPDATE SCANNER
// ---------------------------------------------------------------------------
// Parses the KNOWLEDGE_BASE.md for external GitHub repositories and checks
// the GitHub API for their latest release or commit status to identify any
// "Logic Shards" that have drifted out of date with the Trinity.
// ---------------------------------------------------------------------------

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const KNOWLEDGE_BASE_PATH = path.resolve(process.cwd(), 'akashik_guides/KNOWLEDGE_BASE.md');

interface RepoData {
  owner: string;
  repo: string;
  link: string;
  name: string;
}

function parseKnowledgeBase(): RepoData[] {
  if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
    console.error(`${RED}ERROR: KNOWLEDGE_BASE.md not found at ${KNOWLEDGE_BASE_PATH}${RESET}`);
    process.exit(1);
  }

  const content = fs.readFileSync(KNOWLEDGE_BASE_PATH, 'utf-8');
  const repos: RepoData[] = [];
  
  // Match Markdown table rows with GitHub links
  // Example: | **Claw-Code (Rust)** | [ultraworkers/claw-code](https://github.com/ultraworkers/claw-code) |
  const regex = /\|\s*\*\*([^]+?)\*\*\s*\|\s*\[[^\]]+\]\s*\(\s*https:\/\/github\.com\/([^/]+)\/([^/)]+)\s*\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const name = match[1]?.trim() || 'Unknown';
    const owner = match[2]?.trim() || 'Unknown';
    const repoRaw = match[3]?.trim() || 'Unknown';
    const repo = repoRaw.replace(/\)$/, '');
    
    repos.push({
      name,
      owner,
      repo,
      link: `https://github.com/${owner}/${repo}`
    });
  }

  return repos;
}

async function fetchLatestStatus(owner: string, repo: string) {
  const headers: Record<string, string> = {
    'User-Agent': '50V3R31GN-M4CH1N4-Audit-Scanner',
    'Accept': 'application/vnd.github.v3+json'
  };

  // Check Release
  let releaseStatus = 'No releases';
  let releaseDate = '';
  
  try {
    const relRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers });
    if (relRes.ok) {
      const relData = await relRes.json() as any;
      releaseStatus = relData.tag_name || 'Unknown tag';
      releaseDate = relData.published_at || relData.created_at || '';
    } else if (relRes.status === 403) {
       return { error: 'Rate Limited' };
    }
  } catch (e) {
    // Ignore fetch errors
  }

  // Check Latest Commit (if no releases, or to see raw activity)
  let latestCommitDate = '';
  try {
    const comRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, { headers });
    if (comRes.ok) {
      const comData = await comRes.json() as any[];
      if (comData.length > 0 && comData[0].commit && comData[0].commit.author) {
        latestCommitDate = comData[0].commit.author.date;
      }
    }
  } catch (e) {
    // Ignore fetch errors
  }

  return { releaseStatus, releaseDate, latestCommitDate };
}

async function scan() {
  console.log(`\n::/50V3R31GN-M4CH1N4 // L061C_5H4RD_5C4NN3R // 1N171473D\n`);
  
  const repos = parseKnowledgeBase();
  console.log(`◈ Found ${repos.length} external repositories in KNOWLEDGE_BASE.md.`);
  console.log(`◈ Scanning GitHub API for updates... (This may take a moment)\n`);

  // We are currently in April 2026. Any update in 2026 is "Recent". 
  // Any update before 2025 is "Stale".
  const CURRENT_YEAR = 2026;

  for (const r of repos) {
    process.stdout.write(`Scanning ${BLUE}${r.owner}/${r.repo}${RESET}... `);
    const status = await fetchLatestStatus(r.owner, r.repo);
    
    if (status.error) {
       console.log(`[${RED}RATE LIMITED${RESET}]`);
       continue;
    }

    const dateToUse = status.releaseDate || status.latestCommitDate || '';
    const yearMatch = dateToUse ? dateToUse.match(/^(\d{4})/) : null;
    const year = yearMatch ? parseInt(yearMatch[1] ?? '0', 10) : 0;
    
    let freshness = '';
    if (year === CURRENT_YEAR) {
        freshness = `${GREEN}[FRESH - ${year}]${RESET}`;
    } else if (year >= CURRENT_YEAR - 1) {
        freshness = `${YELLOW}[LAGGING - ${year}]${RESET}`;
    } else if (year > 0) {
        freshness = `${RED}[STALE - ${year}]${RESET}`;
    } else {
        freshness = `[UNKNOWN]`;
    }

    console.log(`${freshness}`);
    if (status.releaseStatus !== 'No releases') {
      console.log(`  └─ Release: ${status.releaseStatus} (${status.releaseDate?.split('T')[0] || 'Unknown'})`);
    } else {
      console.log(`  └─ Latest Commit: ${status.latestCommitDate?.split('T')[0] || 'Unknown'}`);
    }
  }

  console.log(`\n::/5C4N_C0MPL373 // 4LL_5H4RD5_V3R1F13D.\n`);
}

scan().catch(console.error);
