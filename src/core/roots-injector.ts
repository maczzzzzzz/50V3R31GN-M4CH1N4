import type { Database } from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SovereignProfile } from './interfaces.js';

export interface DistrictDNA {
  id: string;
  district_name: string;
  hostility_baseline: number;
  lore_fragments_json: string;
  persona_override: string | null;
}

export class RootsInjector {
  private readonly directorSoulPath: string;
  private readonly researcherSoulPath: string;
  private readonly osSoulPath: string;
  private cachedDirectorSoul: string | null = null;
  private cachedResearcherSoul: string | null = null;
  private cachedOsSoul: string | null = null;
  private activeProfile: SovereignProfile = 'SOVEREIGN_OS';

  constructor(private readonly db: Database, private readonly projectRoot: string, soulContent?: string) {
    this.directorSoulPath = path.join(projectRoot, 'docs/superpowers/archive/DIRECTOR_SOUL.md');
    this.researcherSoulPath = path.join(projectRoot, 'RESEARCHER_SOUL.md');
    this.osSoulPath = path.join(projectRoot, 'SOUL.md');
    if (soulContent) this.cachedOsSoul = soulContent;
  }

  public setProfile(profile: SovereignProfile): void {
    this.activeProfile = profile;
  }

  private getSoul(): string {
    if (this.activeProfile === 'RED_DIRECTOR') {
      if (this.cachedDirectorSoul) return this.cachedDirectorSoul;
      try {
        this.cachedDirectorSoul = fs.readFileSync(this.directorSoulPath, 'utf8');
        return this.cachedDirectorSoul;
      } catch (e) {
        console.warn(`[RootsInjector] Failed to load DIRECTOR_SOUL.md: ${(e as Error).message}. Using fallback.`);
        return 'You are The Sovereign Director. Stay in character.';
      }
    } else if (this.activeProfile === 'RESEARCHER') {
      if (this.cachedResearcherSoul) return this.cachedResearcherSoul;
      try {
        this.cachedResearcherSoul = fs.readFileSync(this.researcherSoulPath, 'utf8');
        return this.cachedResearcherSoul;
      } catch (e) {
        console.warn(`[RootsInjector] Failed to load RESEARCHER_SOUL.md: ${(e as Error).message}. Using fallback.`);
        return 'You are The Sovereign Researcher. Discovery-First is law.';
      }
    } else {
      if (this.cachedOsSoul) return this.cachedOsSoul;
      try {
        this.cachedOsSoul = fs.readFileSync(this.osSoulPath, 'utf8');
        return this.cachedOsSoul;
      } catch (e) {
        console.warn(`[RootsInjector] Failed to load SOUL.md: ${(e as Error).message}. Using fallback.`);
        return 'You are The Sovereign OS. Be clinical and objective.';
      }
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

    // Only inject chronicles and DNA if in RED_DIRECTOR mode to keep OS context clean
    if (this.activeProfile === 'RED_DIRECTOR') {
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
    }

    return injected;
  }
}

