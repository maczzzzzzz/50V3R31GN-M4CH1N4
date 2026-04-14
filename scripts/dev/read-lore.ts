import Database from 'better-sqlite3';

const db = new Database('./data/Akashik.db', { readonly: true });
const rows = db.prepare("SELECT district_name, lore_fragments_json FROM district_dna").all();

rows.forEach((row: any) => {
  console.log(`District: ${row.district_name}`);
  console.log(`Lore: ${row.lore_fragments_json}`);
  console.log('---');
});

db.close();
