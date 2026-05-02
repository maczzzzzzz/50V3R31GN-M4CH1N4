import { NextResponse } from 'next/server';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

/**
 * API_SOCIAL_HIGHLIGHTS : v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS (Social Intelligence Mesh)
 * 
 * Returns the top 5 shards/triplets by reputation_score.
 */

export async function GET(request: Request) {
  const dbPath = path.join(process.cwd(), 'data', 'SovereignIntelligence.db');
  const dbBuffer = fs.readFileSync(dbPath);

  const SQL = await initSqlJs();
  const db = new SQL.Database(dbBuffer);

  const query = `
    SELECT id, name as label, reputation_score 
    FROM intelligence_shards 
    WHERE reputation_score > 0 
    UNION 
    SELECT subject_id as id, subject_id as label, reputation_score 
    FROM os_triplets 
    WHERE reputation_score > 0
    ORDER BY reputation_score DESC 
    LIMIT 5
  `;
  
  const results = db.exec(query);
  if (results.length === 0) return NextResponse.json([]);

  const rows = results[0].values;
  const highlights = rows.map(row => ({
    id: row[0],
    label: row[1],
    reputation_score: row[2]
  }));

  db.close();

  return NextResponse.json(highlights);
}
