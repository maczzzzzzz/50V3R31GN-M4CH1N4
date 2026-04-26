import { NextResponse } from 'next/server';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';

/**
 * API_SPATIAL_NODES : v3.8.6 (Neural Promenade)
 * 
 * Streams 3D coordinates and labels from SovereignIntelligence.db.
 */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const x = parseFloat(searchParams.get('x') || '0');
  const y = parseFloat(searchParams.get('y') || '0');
  const z = parseFloat(searchParams.get('z') || '0');
  const r = parseFloat(searchParams.get('r') || '200'); // Default to full view if not specified

  const dbPath = path.join(process.cwd(), 'data', 'SovereignIntelligence.db');
  const dbBuffer = fs.readFileSync(dbPath);

  const SQL = await initSqlJs();
  const db = new SQL.Database(dbBuffer);

  // Query mapping and RTREE
  // We use a spherical proximity filter if requested, or just return everything for the global view
  const query = `
    SELECT m.source_table, m.source_id, m.label, n.minX, n.minY, n.minZ,
           COALESCE(s.reputation_score, t.reputation_score, 0.0) as reputation_score,
           COALESCE(s.peer_validations, t.peer_validations, 0) as peer_validations
    FROM spatial_node_mapping m
    JOIN spatial_palace_nodes n ON m.id = n.id
    LEFT JOIN intelligence_shards s ON m.source_table = 'intelligence_shards' AND m.source_id = s.id
    LEFT JOIN os_triplets t ON m.source_table = 'os_triplets_subject' AND m.source_id = t.subject_id
  `;
  
  const results = db.exec(query);
  if (results.length === 0) return NextResponse.json({ nodes: [], links: [] });

  const rows = results[0].values;
  const nodes = rows.map(row => ({
    id: `${row[0]}:${row[1]}`,
    table: row[0],
    source_id: row[1],
    label: row[2],
    x: row[3],
    y: row[4],
    z: row[5],
    reputation_score: row[6],
    peer_validations: row[7]
  }));

  // Fetch Links (Consensus Links / Trust Web)
  const linkQuery = `
    SELECT subject_id, object_literal, peer_validations 
    FROM os_triplets 
    WHERE peer_validations > 0 OR predicate = 'FOLLOWS' OR predicate = 'BOOSTS'
  `;
  
  const linkResults = db.exec(linkQuery);
  const links = [];
  if (linkResults.length > 0) {
     linkResults[0].values.forEach(row => {
        links.push({
           source: `os_triplets_subject:${row[0]}`,
           target: `os_triplets_subject:${row[1]}`,
           value: row[2]
        });
     });
  }

  // Also include high reputation highlights endpoint logic if needed or separate route
  
  db.close();

  return NextResponse.json({ nodes, links });
}
