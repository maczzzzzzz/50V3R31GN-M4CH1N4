import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * ScopedSwarmManager — Phase 107 Task 4
 * 
 * Manages project-specific swarm configurations by discovering .agent/ folders
 * and merging instructions from Ankh.md or manifest.yaml.
 */
export class ScopedSwarmManager {
  /**
   * Discovers and merges instructions from .agent/ directories.
   * Walks up from currentDir until projectRoot is reached or filesystem root.
   */
  public static discoverInstructions(currentDir: string, projectRoot: string): string[] {
    const instructions: string[] = [];
    let searchDir = path.resolve(currentDir);
    const rootDir = path.resolve(projectRoot);

    while (true) {
      const agentDir = path.join(searchDir, '.agent');
      if (fs.existsSync(agentDir) && fs.statSync(agentDir).isDirectory()) {
        const ankhPath = path.join(agentDir, 'Ankh.md');
        const manifestPath = path.join(agentDir, 'manifest.yaml');

        if (fs.existsSync(ankhPath)) {
          instructions.push(fs.readFileSync(ankhPath, 'utf8'));
        } else if (fs.existsSync(manifestPath)) {
          // For now just read the whole manifest, but could be parsed
          instructions.push(fs.readFileSync(manifestPath, 'utf8'));
        }
      }

      if (searchDir === rootDir || searchDir === path.parse(searchDir).root) {
        break;
      }
      searchDir = path.dirname(searchDir);
    }

    return instructions;
  }
}
