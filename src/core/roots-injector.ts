import type { Database } from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface DistrictDNA {
  id: string;
  district_name: string;
  hostility_baseline: number;
  lore_fragments_json: string;
  persona_override: string | null;
}

export class RootsInjector {
  private readonly soulPath: string;
  private cachedSoul: string | null = null;

  constructor(private readonly db: Database, projectRoot: string, soulContent?: string) {
    this.soulPath = path.join(projectRoot, 'DIRECTOR_SOUL.md');
    if (soulContent) this.cachedSoul = soulContent;
  }

  private getSoul(): string {
    if (this.cachedSoul) return this.cachedSoul;
    try {
      this.cachedSoul = fs.readFileSync(this.soulPath, 'utf8');
      return this.cachedSoul;
    } catch (e) {
      console.warn(`[RootsInjector] Failed to load DIRECTOR_SOUL.md: ${(e as Error).message}. Using fallback.`);
      return 'You are The Sovereign Director. Stay in character.';
    }
  }

  public getDNA(districtName: string): DistrictDNA | null {
    try {
      const stmt = this.db.prepare('SELECT * FROM district_dna WHERE district_name = ?');
      return stmt.get(districtName) as DistrictDNA | null;
    } catch {
      return null;
    }
  }

  public getChronicles(): Array<{title: string, content: string, category: string}> {
    try {
      const stmt = this.db.prepare("SELECT title, content, category FROM chronicle_seeds WHERE status = 'approved' ORDER BY RANDOM() LIMIT 2");
      return stmt.all() as Array<{title: string, content: string, category: string}>;
    } catch {
      return [];
    }
  }

  public inject(districtName: string | null, baseSystemPrompt: string): string {
    const soul = this.getSoul();
    let injected = `${soul}\n\n${baseSystemPrompt}`;
    
    // Phase 33: Unified Lore Mind (Chronicle Seeds)
    const chronicles = this.getChronicles();
    if (chronicles.length > 0) {
      injected += `\n\n[CHRONICLE SEEDS (Treat #Technical as high-authority rules, #Gossip as narrative flavor)]\n`;
      chronicles.forEach(c => {
        injected += `- [${c.category}] ${c.title}: ${c.content}\n`;
      });
    }

    if (districtName) {
      const dna = this.getDNA(districtName);
      if (dna) {
        injected += `\n\n[DISTRICT DNA: ${dna.district_name}]\nHostility Baseline: ${dna.hostility_baseline}`;
        if (dna.persona_override) {
          injected += `\nPersona Override: ${dna.persona_override}`;
        }
        try {
          const fragments = JSON.parse(dna.lore_fragments_json);
          if (Array.isArray(fragments) && fragments.length > 0) {
            // Randomly sample up to 3 fragments to prevent context overflow
            const shuffled = fragments.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, 3);
            injected += `\nLore Fragments: ${selected.join(' | ')}`;
          }
        } catch (e) {
          // ignore JSON parse errors
        }
      }
    }
    
    return injected;
  }
}
