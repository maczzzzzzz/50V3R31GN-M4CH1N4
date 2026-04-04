// src/core/skillstone-service.ts
//
// Skillstone Registry & ICL Injection — Phase 20 (GLOSSOPETRAE)
//
// A Skillstone is a compact (~8k token) Markdown conlang specification injected
// into the LLM context so that NPCs from a given faction can "speak" a procedurally
// generated dialect.  Node B maintains a factionId → seed registry; the seed drives
// a deterministic PRNG that produces the full phonology, grammar, and lexicon.

// ── Seeded PRNG (mulberry32) ──────────────────────────────────────────────────
// Deterministic, self-contained — no external dependency required.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

// ── Phoneme inventories ───────────────────────────────────────────────────────

const VOWEL_SETS: readonly (readonly string[])[] = [
  ['a', 'e', 'i', 'o', 'u'],
  ['a', 'i', 'u', 'ei', 'au'],
  ['a', 'e', 'o', 'ai', 'ou'],
  ['i', 'u', 'a', 'oi', 'ae'],
];

const CONSONANT_SETS: readonly (readonly string[])[] = [
  ['k', 'g', 'r', 'kh', 't', 'n', 'm', 'zh', 'sh'],
  ['ts', 'dz', 'v', 'sh', 'n', 'r', 'k', 'm', 'g'],
  ['p', 'b', 'f', 'v', 's', 'z', 'n', 'l', 'r', 'k'],
  ['gh', 'kh', 'r', 'n', 't', 's', 'sh', 'm', 'v'],
];

const WORD_ORDERS: readonly string[] = ['SVO', 'SOV', 'VSO'];

// ── Core lexicon seeds ─────────────────────────────────────────────────────────
// English entries whose Vekhari forms are generated syllabically.

const LEXICON_ENGLISH: readonly string[] = [
  'see', 'speak', 'go', 'take', 'kill', 'know', 'want', 'give', 'hide', 'run',
  'fixer', 'corpo', 'soldier', 'netrunner', 'credits', 'weapon', 'door', 'street',
  'net', 'building', 'enemy', 'friend', 'information', 'danger', 'safe',
  'now', 'here', 'there', 'yes', 'no', 'fast', 'slow', 'big', 'small',
  'dead', 'alive', 'night', 'day', 'left', 'right',
  'one', 'two', 'three', 'many', 'nothing',
  'mission', 'target', 'escape', 'ambush', 'signal',
];

const TENSE_PARTICLES = ['ra', 'va', 'shi', 'ku', 'zha', 'me'] as const;
const NEG_FORMS = ['-da', '-no', '-ku', '-ve'] as const;
const PLURAL_ANIMATE = ['-ra', '-ri', '-un', '-ak'] as const;
const PLURAL_INANIMATE = ['-ek', '-ok', '-ta', '-vi'] as const;
const QUESTION_PARTICLES = ['ke', 'mo', 'sha', 've'] as const;

// ── Syllable generator ────────────────────────────────────────────────────────

function generateSyllable(
  rng: () => number,
  consonants: readonly string[],
  vowels: readonly string[],
): string {
  const pattern = rng() < 0.6 ? 'CV' : rng() < 0.8 ? 'CVC' : 'VC';
  if (pattern === 'CV') return pick(rng, consonants) + pick(rng, vowels);
  if (pattern === 'CVC') return pick(rng, consonants) + pick(rng, vowels) + pick(rng, consonants);
  return pick(rng, vowels) + pick(rng, consonants);
}

function generateWord(
  rng: () => number,
  consonants: readonly string[],
  vowels: readonly string[],
  syllableCount: 1 | 2 | 3 = 2,
): string {
  const parts: string[] = [];
  for (let i = 0; i < syllableCount; i++) {
    parts.push(generateSyllable(rng, consonants, vowels));
  }
  return parts.join('');
}

// ── Dialect name generator ────────────────────────────────────────────────────

function generateDialectName(rng: () => number, consonants: readonly string[], vowels: readonly string[]): string {
  return generateWord(rng, consonants, vowels, 2).toUpperCase();
}

// ── Pronoun table ─────────────────────────────────────────────────────────────

const PRONOUN_LABELS = ['I/me', 'you (sg)', 'he/she', 'we/us', 'you (pl)', 'they/them'] as const;

function generatePronouns(
  rng: () => number,
  consonants: readonly string[],
  vowels: readonly string[],
): Record<string, string> {
  const pronouns: Record<string, string> = {};
  for (const label of PRONOUN_LABELS) {
    pronouns[label] = generateWord(rng, consonants, vowels, 1);
  }
  return pronouns;
}

// ── Lexicon generator ─────────────────────────────────────────────────────────

function generateLexicon(
  rng: () => number,
  consonants: readonly string[],
  vowels: readonly string[],
): Map<string, string> {
  const lexicon = new Map<string, string>();
  for (const en of LEXICON_ENGLISH) {
    const syllables: 1 | 2 | 3 = rng() < 0.3 ? 1 : rng() < 0.7 ? 2 : 3;
    lexicon.set(en, generateWord(rng, consonants, vowels, syllables));
  }
  return lexicon;
}

// ── Markdown renderer ─────────────────────────────────────────────────────────

export interface SkillstoneSpec {
  readonly dialectName: string;
  readonly wordOrder: string;
  readonly negSuffix: string;
  readonly pastParticle: string;
  readonly futureParticle: string;
  readonly habitualParticle: string;
  readonly pluralAnimate: string;
  readonly pluralInanimate: string;
  readonly questionParticle: string;
  readonly vowels: readonly string[];
  readonly consonants: readonly string[];
  readonly pronouns: Record<string, string>;
  readonly lexicon: Map<string, string>;
}

function renderSkillstone(spec: SkillstoneSpec, factionId: string): string {
  const { dialectName, wordOrder, negSuffix, pastParticle, futureParticle,
          habitualParticle, pluralAnimate, pluralInanimate, questionParticle,
          vowels, consonants, pronouns, lexicon } = spec;

  const I = pronouns['I/me']!;
  const YOU = pronouns['you (sg)']!;
  const THEY = pronouns['they/them']!;
  const WE = pronouns['we/us']!;

  const see = lexicon.get('see') ?? 'vekh';
  const go = lexicon.get('go') ?? 'koru';
  const kill = lexicon.get('kill') ?? 'ghrut';
  const run = lexicon.get('run') ?? 'koruda';
  const hide = lexicon.get('hide') ?? 'zheva';
  const enemy = lexicon.get('enemy') ?? 'khoru';
  const mission = lexicon.get('mission') ?? 'tarka';
  const fast = lexicon.get('fast') ?? 'tukra';
  const left = lexicon.get('left') ?? 'sheva';

  const svoExample = wordOrder === 'SVO'
    ? `${I} ${see} ${YOU}.`
    : wordOrder === 'SOV'
    ? `${I} ${YOU} ${see}.`
    : `${see} ${I} ${YOU}.`;

  const futureExample = wordOrder === 'SVO'
    ? `${THEY} ${futureParticle} ${kill} ${enemy}.`
    : wordOrder === 'SOV'
    ? `${THEY} ${enemy} ${futureParticle} ${kill}.`
    : `${futureParticle} ${kill} ${THEY} ${enemy}.`;

  const lines: string[] = [
    `# SKILLSTONE: ${dialectName}`,
    `**Dialect ID:** ${factionId}  `,
    `**Word Order:** ${wordOrder}  `,
    `**Negation:** Suffix **${negSuffix}** on the verb  `,
    `**Tense System:** Particle-based (past: *${pastParticle}*, future: *${futureParticle}*, habitual: *${habitualParticle}*)  `,
    '',
    '---',
    '',
    '## Phonology',
    '',
    `**Vowels:** ${vowels.join(', ')}  `,
    `**Consonants:** ${consonants.join(', ')}  `,
    '**Syllable Structure:** (C)V(C)  ',
    '**Stress:** Falls on the penultimate syllable; monosyllables unstressed.',
    '',
    '---',
    '',
    '## Grammar',
    '',
    '### Pronouns',
    '| English | Dialect |',
    '|---------|---------|',
    ...Object.entries(pronouns).map(([en, dial]) => `| ${en} | ${dial} |`),
    '',
    '### Tense Particles (precede the verb)',
    '| Tense | Particle |',
    '|-------|----------|',
    `| PRESENT | *(none)* |`,
    `| PAST | **${pastParticle}** |`,
    `| FUTURE | **${futureParticle}** |`,
    `| HABITUAL | **${habitualParticle}** |`,
    '',
    '### Negation',
    `- Append **${negSuffix}** directly to the verb stem.`,
    '',
    '### Plurals',
    `- Animate nouns: suffix **${pluralAnimate}**`,
    `- Inanimate nouns: suffix **${pluralInanimate}**`,
    '',
    '### Questions',
    `- Append particle **${questionParticle}** at end of sentence.`,
    '',
    '---',
    '',
    '## Core Lexicon',
    '',
    '| English | Dialect |',
    '|---------|---------|',
    ...Array.from(lexicon.entries()).map(([en, dial]) => `| ${en} | ${dial} |`),
    '',
    '---',
    '',
    '## Example Sentences',
    '',
    '| English | Dialect | Gloss |',
    '|---------|---------|-------|',
    `| I see you. | *${svoExample}* | ${wordOrder} order |`,
    `| They will kill the enemy. | *${futureExample}* | FUTURE particle |`,
    `| Run now fast. | *${run} ${fast}.* | imperative, no subject |`,
    `| Abort the mission. | *${go}${negSuffix} ${mission}.* | NEG-verb object |`,
    `| We go left. | *${WE} ${go} ${left}.* | pronoun verb dir |`,
    `| Hide! | *${hide}!* | bare imperative |`,
    '',
    '---',
    '',
    '## ICL Instructions for LLM',
    '',
    `When generating dialogue for an NPC using ${dialectName}, follow these rules:`,
    '',
    `1. **Word Order is ${wordOrder}.** Maintain this order strictly.`,
    `2. **Tense particles** (*${pastParticle}*/*${futureParticle}*/*${habitualParticle}*) precede the verb as separate words.`,
    `3. **Negation** is always the suffix **${negSuffix}** on the verb — never a standalone word.`,
    `4. **Plurals:** animate nouns take **${pluralAnimate}**, inanimate take **${pluralInanimate}**.`,
    `5. **Questions** append particle **${questionParticle}** at sentence end.`,
    `6. **Borrowed proper nouns** are phonologically adapted to use only these vowels: ${vowels.join(', ')}.`,
    `7. **Short tactical commands** omit the subject pronoun entirely.`,
    `8. **Mix dialect and English** proportional to the NPC's street credibility — high-cred NPCs use more dialect.`,
  ];

  return lines.join('\n') + '\n';
}

// ── Public API ────────────────────────────────────────────────────────────────

export class SkillstoneService {
  private readonly registry = new Map<string, number>(); // factionId → seed

  /**
   * Register a faction with a numeric seed.  The seed fully determines the
   * dialect — the same seed always produces the same Skillstone.
   */
  register(factionId: string, seed: number): void {
    this.registry.set(factionId, seed);
  }

  /**
   * Return the registered seed for a faction, or undefined if not found.
   */
  getSeed(factionId: string): number | undefined {
    return this.registry.get(factionId);
  }

  /**
   * Generate a deterministic Skillstone Markdown spec from a numeric seed.
   * The output is stable: same seed → identical Markdown across all environments.
   */
  generateSkillstone(seed: number): string {
    const rng = mulberry32(seed);

    const vowels = pick(rng, VOWEL_SETS);
    const consonants = pick(rng, CONSONANT_SETS);
    const wordOrder = pick(rng, WORD_ORDERS);
    const negSuffix = pick(rng, NEG_FORMS);
    const [pastParticle, futureParticle, habitualParticle] = [
      pick(rng, TENSE_PARTICLES),
      pick(rng, TENSE_PARTICLES),
      pick(rng, TENSE_PARTICLES),
    ];
    const pluralAnimate = pick(rng, PLURAL_ANIMATE);
    const pluralInanimate = pick(rng, PLURAL_INANIMATE);
    const questionParticle = pick(rng, QUESTION_PARTICLES);

    const dialectName = generateDialectName(rng, consonants, vowels);
    const pronouns = generatePronouns(rng, consonants, vowels);
    const lexicon = generateLexicon(rng, consonants, vowels);

    const spec: SkillstoneSpec = {
      dialectName,
      wordOrder,
      negSuffix,
      pastParticle,
      futureParticle,
      habitualParticle,
      pluralAnimate,
      pluralInanimate,
      questionParticle,
      vowels,
      consonants,
      pronouns,
      lexicon,
    };

    return renderSkillstone(spec, `seed:${seed}`);
  }

  /**
   * Return the full Skillstone Markdown for a registered faction, or null if
   * the factionId is not in the registry.
   */
  getSkillstone(factionId: string): string | null {
    const seed = this.registry.get(factionId);
    if (seed === undefined) return null;
    return this.generateSkillstone(seed);
  }

  /**
   * List all registered faction IDs.
   */
  listFactions(): string[] {
    return Array.from(this.registry.keys());
  }
}
