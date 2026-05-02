/**
 * HeadlessDatalog — Phase 90: THE UNIFIED SYMBOLIC ARTERY
 *
 * A zero-dependency Datalog-to-SQLite compiler that translates DataScript-style
 * queries directly against the `os_triplets` triple store and `shard_fts` FTS5
 * index inside SovereignIntelligence.db.
 *
 * Supported query syntax (DataScript EDN-subset):
 *   [:find ?var1 ?var2
 *    :where [?e :predicate1 "literal"]
 *           [?e :predicate2 ?var2]]
 *
 * Supported clauses:
 *   :find  — one or more logic variables (?name) or entity variables (?e)
 *   :where — one or more triple patterns [entity attr value]
 *   :in    — optional input bindings (?param → runtime value)
 *   :limit — optional result cap
 *
 * Term types in patterns:
 *   ?var      — logic variable (unbound → SELECT column; bound → JOIN/WHERE equality)
 *   "literal" — string constant (quoted)
 *   $param    — input binding (resolved from :in map at runtime)
 *
 * Compiled SQL targets:
 *   os_triplets  — columns: subject_id, predicate, object_literal, room_id, cluster_id
 *   shard_fts    — FTS5 virtual table via ftsSearch() helper
 */

import Database from 'better-sqlite3';
import type { ILogger } from '../../db/interfaces.js';

// ── AST types ─────────────────────────────────────────────────────────────────

export type Term =
  | { kind: 'var';     name: string }   // ?name
  | { kind: 'literal'; value: string }  // "foo"
  | { kind: 'param';   name: string };  // $param (resolved from :in)

export interface TriplePattern {
  entity:    Term;   // subject position
  attribute: string; // always a keyword (literal attribute name)
  value:     Term;   // object position
}

export interface DatalogQuery {
  find:   string[];          // variable names from :find (without ?)
  where:  TriplePattern[];
  in?:    string[];          // parameter names from :in (without $)
  limit?: number;
}

// ── Compiled output ──────────────────────────────────────────────────────────

export interface CompiledQuery {
  sql:    string;
  params: string[];   // positional ? params for better-sqlite3
}

// ── Query result row ─────────────────────────────────────────────────────────

export type DatalogRow = Record<string, string | null>;

// ── FTS result ───────────────────────────────────────────────────────────────

export interface ShardResult {
  id:      string;
  name:    string;
  sector:  string;
  excerpt: string;
}

// ── Parser ───────────────────────────────────────────────────────────────────

/** Tokenizes a Datalog query string into a flat token stream. */
function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i]!;

    // Whitespace + commas (commas are optional separators in EDN)
    if (/[\s,]/.test(ch)) { i++; continue; }

    // Bracket / paren
    if (ch === '[' || ch === ']') { tokens.push(ch); i++; continue; }

    // Quoted string literal
    if (ch === '"') {
      let j = i + 1;
      while (j < input.length && input[j] !== '"') {
        if (input[j] === '\\') j++; // skip escape
        j++;
      }
      tokens.push(input.slice(i, j + 1)); // includes quotes
      i = j + 1;
      continue;
    }

    // Non-whitespace token (keyword :find, variable ?x, param $p, attr :name)
    let j = i;
    while (j < input.length && !/[\s,\[\]]/.test(input[j]!)) j++;
    tokens.push(input.slice(i, j));
    i = j;
  }
  return tokens;
}

function parseTerm(token: string): Term {
  if (token.startsWith('?')) return { kind: 'var', name: token.slice(1) };
  if (token.startsWith('$')) return { kind: 'param', name: token.slice(1) };
  if (token.startsWith('"') && token.endsWith('"')) {
    return { kind: 'literal', value: token.slice(1, -1) };
  }
  // Bare word (no quotes) — treat as literal
  return { kind: 'literal', value: token };
}

/**
 * Parse a DataScript-style query string into a DatalogQuery AST.
 *
 * Input example:
 *   '[:find ?name :where [?e :is-a "agent"] [?e :name ?name]]'
 */
export function parseDatalog(input: string): DatalogQuery {
  // Strip outer brackets if present
  const stripped = input.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  const tokens = tokenize(`[${stripped}]`);

  const query: DatalogQuery = { find: [], where: [] };
  let idx = 0;

  function peek(): string | undefined { return tokens[idx]; }
  function consume(): string { return tokens[idx++]!; }
  function expect(t: string) { if (consume() !== t) throw new Error(`DatalogParser: expected '${t}'`); }

  // Skip outer [
  expect('[');

  while (idx < tokens.length && peek() !== ']') {
    const kw = consume();

    if (kw === ':find') {
      // Collect variables until we hit another keyword or bracket
      while (idx < tokens.length && peek() !== ']' && !peek()?.startsWith(':')) {
        const tok = consume();
        if (tok === '[' || tok === ']') continue;
        if (tok.startsWith('?')) query.find.push(tok.slice(1));
      }
      continue;
    }

    if (kw === ':in') {
      query.in = [];
      while (idx < tokens.length && peek() !== ']' && !peek()?.startsWith(':')) {
        const tok = consume();
        if (tok.startsWith('$')) query.in.push(tok.slice(1));
      }
      continue;
    }

    if (kw === ':limit') {
      const n = consume();
      query.limit = parseInt(n, 10);
      continue;
    }

    if (kw === ':where') {
      // Each pattern is a [entity :attr value] group
      while (idx < tokens.length && peek() !== ']' && !peek()?.startsWith(':')) {
        if (peek() !== '[') { consume(); continue; }
        consume(); // '['
        const entityTok = consume();
        const attrTok   = consume();
        const valueTok  = consume();
        consume(); // ']'

        const attrName = attrTok.startsWith(':') ? attrTok.slice(1) : attrTok;

        query.where.push({
          entity:    parseTerm(entityTok),
          attribute: attrName,
          value:     parseTerm(valueTok),
        });
      }
      continue;
    }
  }

  if (query.find.length === 0) throw new Error('DatalogParser: :find clause is empty');
  if (query.where.length === 0) throw new Error('DatalogParser: :where clause is empty');

  return query;
}

// ── Compiler ─────────────────────────────────────────────────────────────────

/** Maps a variable name to the SQL expression that resolves it. */
type VarBinding = { expr: string }; // e.g. "t0.subject_id"

/**
 * Compile a DatalogQuery to a CompiledQuery (SQL + positional params).
 *
 * Algorithm:
 *  - Each WHERE pattern gets an alias tN for os_triplets.
 *  - The first pattern becomes FROM os_triplets t0.
 *  - Subsequent patterns become JOIN os_triplets tN ON <entity-join>.
 *  - Predicate literals go into WHERE.
 *  - Object literals go into WHERE.
 *  - Logic variables are tracked: first occurrence registers binding; subsequent
 *    occurrences add equality constraints.
 *
 * @param bindings  Runtime values for $param terms (from :in at call time).
 */
export function compileDatalog(
  query: DatalogQuery,
  bindings: Record<string, string> = {},
): CompiledQuery {
  const params: string[] = [];
  const vars = new Map<string, VarBinding>();

  const fromParts: string[]  = [];
  const whereParts: string[] = [];

  function resolveTerm(term: Term): string | null {
    if (term.kind === 'literal') return null; // handled inline
    if (term.kind === 'param') {
      const v = bindings[term.name];
      if (v === undefined) throw new Error(`DatalogCompiler: unbound param $${term.name}`);
      return null; // value pushed to params inline
    }
    return vars.get(term.name)?.expr ?? null;
  }

  for (let i = 0; i < query.where.length; i++) {
    const pat  = query.where[i]!;
    const alias = `t${i}`;

    // ── FROM / JOIN ───────────────────────────────────────────────────────────
    if (i === 0) {
      fromParts.push(`os_triplets ${alias}`);
    } else {
      // Determine JOIN ON condition from entity term
      let joinOn = '1=1';
      if (pat.entity.kind === 'var') {
        const prev = vars.get(pat.entity.name);
        if (prev) joinOn = `${alias}.subject_id = ${prev.expr}`;
      } else if (pat.entity.kind === 'param') {
        const pv = bindings[pat.entity.name];
        if (pv !== undefined) {
          joinOn = `${alias}.subject_id = ?`;
          params.push(pv);
        }
      } else {
        // Entity is a literal — push to WHERE, JOIN unconditionally
        joinOn = '1=1';
      }
      fromParts.push(`JOIN os_triplets ${alias} ON ${joinOn}`);
    }

    // ── Register or constrain entity variable ────────────────────────────────
    if (pat.entity.kind === 'var') {
      if (!vars.has(pat.entity.name)) {
        vars.set(pat.entity.name, { expr: `${alias}.subject_id` });
      } else if (i > 0) {
        // Already joined via ON clause — no extra WHERE needed
      }
    } else if (pat.entity.kind === 'literal' || pat.entity.kind === 'param') {
      // For i==0 these become WHERE conditions; for i>0 they were handled above
      if (i === 0) {
        if (pat.entity.kind === 'literal') {
          whereParts.push(`${alias}.subject_id = ?`);
          params.push(pat.entity.value);
        } else {
          const pv = bindings[pat.entity.name];
          if (pv !== undefined) { whereParts.push(`${alias}.subject_id = ?`); params.push(pv); }
        }
      }
    }

    // ── Predicate (always literal keyword) ───────────────────────────────────
    whereParts.push(`${alias}.predicate = ?`);
    params.push(pat.attribute);

    // ── Object / value term ──────────────────────────────────────────────────
    if (pat.value.kind === 'var') {
      const prev = vars.get(pat.value.name);
      if (prev) {
        // Variable already bound — add equality constraint
        whereParts.push(`${alias}.object_literal = ${prev.expr}`);
      } else {
        vars.set(pat.value.name, { expr: `${alias}.object_literal` });
      }
    } else if (pat.value.kind === 'literal') {
      whereParts.push(`${alias}.object_literal = ?`);
      params.push(pat.value.value);
    } else {
      // param
      const pv = bindings[pat.value.name];
      if (pv !== undefined) {
        whereParts.push(`${alias}.object_literal = ?`);
        params.push(pv);
      }
    }
  }

  // ── SELECT ───────────────────────────────────────────────────────────────
  const selectCols = query.find.map(varName => {
    const binding = vars.get(varName);
    if (!binding) throw new Error(`DatalogCompiler: find variable ?${varName} is not bound in :where`);
    return `${binding.expr} AS ${JSON.stringify(`?${varName}`)}`;
  });

  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
  const limitClause = query.limit ? `LIMIT ${query.limit}` : '';

  const sql = [
    `SELECT ${selectCols.join(', ')}`,
    `FROM ${fromParts.join('\n     ')}`,
    whereClause,
    limitClause,
  ].filter(Boolean).join('\n');

  return { sql, params };
}

// ── HeadlessDatalog service ──────────────────────────────────────────────────

/**
 * HeadlessDatalog — primary Phase 90 surface.
 *
 * Wraps parse → compile → execute into a single ergonomic API.
 * Requires a live better-sqlite3 Database handle pointing to
 * SovereignIntelligence.db (which contains os_triplets + shard_fts).
 */
export class HeadlessDatalog {
  private readonly db: Database.Database;
  private readonly logger: ILogger | undefined;

  constructor(db: Database.Database, logger?: ILogger) {
    this.db = db;
    this.logger = logger;
    this.ensureSchema();
  }

  /** Idempotent schema bootstrap — ensures os_triplets exists if missing. */
  private ensureSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS os_triplets (
        id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        subject_id     TEXT NOT NULL,
        predicate      TEXT NOT NULL,
        object_literal TEXT NOT NULL,
        room_id        TEXT,
        cluster_id     TEXT,
        source_id      TEXT,
        last_updated   DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (subject_id, predicate, object_literal)
      );
    `);
  }

  // ── Core query API ─────────────────────────────────────────────────────────

  /**
   * Execute a Datalog query string against os_triplets.
   * Returns an array of result rows — each key is the find variable (?name etc.).
   *
   * @param queryStr  DataScript-style query string
   * @param bindings  Optional $param → value map for :in parameters
   */
  query(queryStr: string, bindings: Record<string, string> = {}): DatalogRow[] {
    const ast = parseDatalog(queryStr);
    const { sql, params } = compileDatalog(ast, bindings);

    this.logger?.debug('HeadlessDatalog', 'query', 'Executing Datalog', { queryStr, sql });

    try {
      const rows = this.db.prepare(sql).all(...params) as DatalogRow[];
      return rows;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger?.warn('HeadlessDatalog', 'query', `Query failed: ${msg}`, { sql });
      throw new Error(`HeadlessDatalog.query failed: ${msg}\nSQL: ${sql}`);
    }
  }

  /**
   * Return the compiled SQL without executing it.
   * Useful for debugging, logging, and the /datalog system command.
   */
  compile(queryStr: string, bindings: Record<string, string> = {}): string {
    const ast = parseDatalog(queryStr);
    const { sql, params } = compileDatalog(ast, bindings);
    // Inline params for readability
    let annotated = sql;
    let pi = 0;
    annotated = annotated.replace(/\?/g, () => `'${params[pi++] ?? ''}'`);
    return annotated;
  }

  /**
   * Parse a query string into its AST for inspection.
   */
  parse(queryStr: string): DatalogQuery {
    return parseDatalog(queryStr);
  }

  // ── Fact manipulation ──────────────────────────────────────────────────────

  /**
   * Assert a single (subject, predicate, object) fact into os_triplets.
   * Idempotent — UPSERT with last_updated refresh on conflict.
   */
  upsertFact(subject: string, predicate: string, object: string, meta?: { roomId?: string; clusterId?: string; sourceId?: string }): void {
    this.db.prepare(`
      INSERT INTO os_triplets (subject_id, predicate, object_literal, room_id, cluster_id, source_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT (subject_id, predicate, object_literal)
        DO UPDATE SET last_updated = CURRENT_TIMESTAMP,
          room_id    = COALESCE(excluded.room_id,    os_triplets.room_id),
          cluster_id = COALESCE(excluded.cluster_id, os_triplets.cluster_id)
    `).run(
      subject, predicate, object,
      meta?.roomId ?? null,
      meta?.clusterId ?? null,
      meta?.sourceId ?? null,
    );
  }

  /**
   * Batch-upsert an array of facts in a single transaction.
   */
  upsertFacts(facts: Array<{ subject: string; predicate: string; object: string; roomId?: string; clusterId?: string }>): void {
    const stmt = this.db.prepare(`
      INSERT INTO os_triplets (subject_id, predicate, object_literal, room_id, cluster_id)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT (subject_id, predicate, object_literal)
        DO UPDATE SET last_updated = CURRENT_TIMESTAMP
    `);
    this.db.transaction(() => {
      for (const f of facts) {
        stmt.run(f.subject, f.predicate, f.object, f.roomId ?? null, f.clusterId ?? null);
      }
    })();
  }

  /**
   * Retract all facts for a (subject, predicate) pair.
   */
  retract(subject: string, predicate: string): number {
    const result = this.db.prepare(
      'DELETE FROM os_triplets WHERE subject_id = ? AND predicate = ?'
    ).run(subject, predicate);
    return result.changes;
  }

  // ── FTS5 full-text search ─────────────────────────────────────────────────

  /**
   * Full-text search against the shard_fts FTS5 index.
   * Returns matching intelligence_shards with BM25-ranked snippets.
   *
   * Falls back to LIKE search on content if shard_fts does not exist.
   */
  ftsSearch(queryText: string, limit = 10): ShardResult[] {
    // Check if FTS table exists
    const hasFts = this.db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='shard_fts'`
    ).get();

    if (hasFts) {
      return this.db.prepare(`
        SELECT
          i.id,
          i.name,
          i.sector,
          snippet(shard_fts, 2, '[', ']', '...', 10) AS excerpt
        FROM shard_fts
        JOIN intelligence_shards i ON shard_fts.rowid = i.rowid
        WHERE shard_fts MATCH ?
        ORDER BY rank
        LIMIT ?
      `).all(queryText, limit) as ShardResult[];
    }

    // Fallback: LIKE search on intelligence_shards if FTS not present
    const hasShards = this.db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='intelligence_shards'`
    ).get();

    if (hasShards) {
      return this.db.prepare(`
        SELECT id, name, sector, substr(content, 1, 200) AS excerpt
        FROM intelligence_shards
        WHERE content LIKE ?
        LIMIT ?
      `).all(`%${queryText}%`, limit) as ShardResult[];
    }

    return [];
  }

  // ── Aggregate helpers ──────────────────────────────────────────────────────

  /**
   * Returns all distinct predicates for a subject.
   * Equivalent to: [:find ?p :where [subject ?p _]]
   */
  getAttributes(subject: string): string[] {
    const rows = this.db.prepare(
      'SELECT DISTINCT predicate FROM os_triplets WHERE subject_id = ?'
    ).all(subject) as Array<{ predicate: string }>;
    return rows.map(r => r.predicate);
  }

  /**
   * Returns all subjects with a given predicate+object pair.
   * Equivalent to: [:find ?e :where [?e predicate object]]
   */
  findSubjects(predicate: string, object: string): string[] {
    const rows = this.db.prepare(
      'SELECT DISTINCT subject_id FROM os_triplets WHERE predicate = ? AND object_literal = ?'
    ).all(predicate, object) as Array<{ subject_id: string }>;
    return rows.map(r => r.subject_id);
  }

  /**
   * Returns stats about the triple store.
   */
  stats(): { triplets: number; subjects: number; predicates: number } {
    const triplets  = (this.db.prepare('SELECT count(*) AS n FROM os_triplets').get() as { n: number }).n;
    const subjects  = (this.db.prepare('SELECT count(DISTINCT subject_id) AS n FROM os_triplets').get() as { n: number }).n;
    const predicates = (this.db.prepare('SELECT count(DISTINCT predicate) AS n FROM os_triplets').get() as { n: number }).n;
    return { triplets, subjects, predicates };
  }
}
