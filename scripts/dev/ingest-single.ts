import Database from 'better-sqlite3';
import { VisualRAGService } from '../../src/core/ingest/VisualRAGService';
import fs from 'node:fs/promises';
import path from 'node:path';

const DB_PATH = process.env['AKASHIK_DB_PATH'] ?? 'data/Akashik.db';
const db = new Database(DB_PATH);

async function run() {
  process.env['NODE_A_HOST'] = 'localhost';
  console.log("::/INGEST-SINGLE START");
  
  const rag = new VisualRAGService(db);
  const shardPath = 'data/ingest/pdf_shards/RTG-CPR-BlackChrome.json';
  const raw = await fs.readFile(shardPath, 'utf-8');
  const manifest = JSON.parse(raw);
  
  const ragResults = await rag.indexManifest(manifest);
  console.log("Visual RAG results for BlackChrome:", ragResults);
  
  db.close();
  console.log("::/INGEST-SINGLE COMPLETE");
}

run().catch(console.error);
