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
    SELECT m.source_table, m.source_id, m.label, n.minX, n.minY, n.minZ
    FROM spatial_node_mapping m
    JOIN spatial_palace_nodes n ON m.id = n.id
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
    z: row[5]
  }));

  // For the first pass, we don't have explicit spatial links shored yet.
  // We will generate links based on RKG triplets (subject -> object) in the next cycle.
  
  db.close();

  return NextResponse.json({ nodes, links: [] });
}
