/**
 * src/core/rules-grep-service.ts
 *
 * RulesGrepService — Precision Context Compaction
 *
 * Implements the "Search-and-Extract" pattern to replace broad vector RAG.
 * Scans rulebook Markdown files for exact keyword matches and returns
 * the relevant lines/tables to keep the prompt window pristine.
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

export interface GrepResult {
  file: string;
  line: number;
  content: string;
}

export class RulesGrepService {
  private readonly rulesDir: string;

  constructor(rulesDir: string = 'docs/raw_data/core_rules') {
    this.rulesDir = rulesDir;
  }

  /**
   * Search all rulebook files for a precision keyword.
   * @param keyword The term to search for (e.g. "Heavy Pistol", "DV 13").
   * @param contextLines Number of surrounding lines to include.
   */
  async search(keyword: string, contextLines: number = 2): Promise<string> {
    if (!fs.existsSync(this.rulesDir)) {
      return '';
    }

    const files = fs.readdirSync(this.rulesDir).filter(f => f.endsWith('.md'));
    const matches: string[] = [];

    for (const file of files) {
      const filePath = path.join(this.rulesDir, file);
      const fileMatches = await this.searchInFile(filePath, keyword, contextLines);
      if (fileMatches) {
        matches.push(`--- FROM ${file} ---\n${fileMatches}`);
      }
    }

    return matches.join('\n\n');
  }

  private async searchInFile(filePath: string, keyword: string, contextLines: number): Promise<string | null> {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    
    const lines: string[] = [];
    let matchFound = false;
    let currentLine = 0;
    const matchIndices: number[] = [];

    for await (const line of rl) {
      lines.push(line);
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        matchIndices.push(currentLine);
        matchFound = true;
      }
      currentLine++;
    }

    if (!matchFound) return null;

    // Extract match blocks with context
    const output: string[] = [];
    const processedIndices = new Set<number>();

    for (const index of matchIndices) {
      const start = Math.max(0, index - contextLines);
      const end = Math.min(lines.length - 1, index + contextLines);

      for (let i = start; i <= end; i++) {
        if (!processedIndices.has(i)) {
          output.push(lines[i]!);
          processedIndices.add(i);
        }
      }
      output.push('...'); // Block separator
    }

    return output.join('\n');
  }
}
