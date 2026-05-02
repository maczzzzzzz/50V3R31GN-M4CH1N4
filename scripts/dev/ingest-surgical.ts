import Database from 'better-sqlite3';
import { VisualRAGService } from '../../packages/hermes-core/src/core/ingest/VisualRAGService';

const db = new Database('data/Akashik.db');

async function run() {
  console.log("::/SURGICAL_INGESTION_START");
  process.env['NODE_A_HOST'] = 'localhost';
  
  const rag = new VisualRAGService(db);
  const result = await rag.indexAll();
  console.log("Surgical RAG Result:", result);
  
  db.close();
}

run().catch(console.error);
