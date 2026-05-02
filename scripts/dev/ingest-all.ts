import Database from 'better-sqlite3';
import { LoreHarmonizer } from '../../packages/hermes-core/src/core/ingest/LoreHarmonizer';
import { VisualRAGService } from '../../packages/hermes-core/src/core/ingest/VisualRAGService';

const DB_PATH = process.env['AKASHIK_DB_PATH'] ?? 'data/Akashik.db';
const db = new Database(DB_PATH);

async function run() {
  process.env['NODE_A_HOST'] = 'localhost';
  console.log("::/INGEST-ALL START");
  
  const harmonizer = new LoreHarmonizer(db);
  const harmResults = await harmonizer.harmonizeAll();
  console.log("Harmonization results:", harmResults);

  const rag = new VisualRAGService(db);
  const ragResults = await rag.indexAll();
  console.log("Visual RAG results:", ragResults);
  
  db.close();
  console.log("::/INGEST-ALL COMPLETE");
}

run().catch(console.error);
