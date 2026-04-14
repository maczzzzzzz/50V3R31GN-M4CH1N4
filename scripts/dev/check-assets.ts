import Database from 'better-sqlite3';

const db = new Database('./data/Akashik.db', { readonly: true });
const stats = db.prepare("SELECT category, COUNT(*) as count FROM assets GROUP BY category").all();
console.log("Asset Statistics:");
console.table(stats);

const samples = db.prepare("SELECT faction, category, file_name FROM assets WHERE category IN ('map', 'tile') LIMIT 10").all();
console.log("\nSample Maps/Tiles:");
console.table(samples);

db.close();
