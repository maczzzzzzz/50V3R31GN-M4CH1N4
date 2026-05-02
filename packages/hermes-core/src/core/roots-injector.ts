import type { Database } from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SovereignProfile } from './interfaces.js';
import { ScopedSwarmManager } from './hermes/ScopedSwarmManager.js';

/**
 * ◈ ROOTS_INJECTOR : Clean BASE
 *
 * Injects physical soul metadata and scoped swarm instructions into LLM prompts.
 */
export class RootsInjector {
  private readonly researcherSoulPath: string;
  private readonly osSoulPath: string;
  private cachedResearcherSoul: string | null = null;
  private cachedOsSoul: string | null = null;
  private activeProfile: SovereignProfile = 'SOVEREIGN_OS';

  constructor(private readonly db: Database, private readonly projectRoot: string, soulContent?: string) {
    this.researcherSoulPath = path.join(projectRoot, 'RESEARCHER_SOUL.md');
    this.osSoulPath = path.join(projectRoot, 'SOUL.md');
    if (soulContent) this.cachedOsSoul = soulContent;
  }

  public setProfile(profile: SovereignProfile): void {
    this.activeProfile = profile;
  }

  /**
   * ◈ Phase 107 Task 4: Scoped Swarm Injection
   * Merges project-specific instructions from Ankh.md into the base system prompt.
   */
  public discover_state(currentDir: string, baseSystemPrompt: string): string {
    const scopedInstructions = ScopedSwarmManager.discoverInstructions(currentDir, this.projectRoot);
    let mergedPrompt = baseSystemPrompt;
    if (scopedInstructions.length > 0) {
      mergedPrompt += `\n\n[SCOPED SWARM INSTRUCTIONS (Ankh.md)]\n${scopedInstructions.join('\n---\n')}`;
    }
    return mergedPrompt;
  }

  private getSoul(): string {
    if (this.activeProfile === 'RESEARCHER') {
      if (this.cachedResearcherSoul) return this.cachedResearcherSoul;
      try {
        this.cachedResearcherSoul = fs.readFileSync(this.researcherSoulPath, 'utf8');
        return this.cachedResearcherSoul;
      } catch (e) {
        return 'You are The Sovereign Researcher. Discovery-First is law.';
      }
    } else {
      if (this.cachedOsSoul) return this.cachedOsSoul;
      try {
        this.cachedOsSoul = fs.readFileSync(this.osSoulPath, 'utf8');
        return this.cachedOsSoul;
      } catch (e) {
        return 'You are The Sovereign OS. Be clinical and objective.';
      }
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

    // Inject approved chronicles for general context
    const chronicles = this.getChronicles();
    if (chronicles.length > 0) {
      injected += `\n\n[SYSTEM CHRONICLES]\n`;
      chronicles.forEach(c => {
        injected += `- [${c.category}] ${c.title}: ${c.content}\n`;
      });
    }

    return injected;
  }
}
