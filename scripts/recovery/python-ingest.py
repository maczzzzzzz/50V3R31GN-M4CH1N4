import sqlite3
import json
import os
import glob
import hashlib
from datetime import datetime

DB_PATH = 'data/Akashik.db'
MOOKS_DIR = 'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks'
TTTA_DIR = 'docs/raw_data/campaign_ttta'

def get_hash(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def ingest_json():
    print(">> INITIATING PYTHON RECOVERY INGESTION...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Ingest Mooks (Actors)
    mook_files = glob.glob(os.path.join(MOOKS_DIR, '**/*.json'), recursive=True)
    npcs_inserted = 0
    for f_path in mook_files:
        try:
            with open(f_path, 'r', encoding='utf-8') as f:
                actor = json.load(f)
                name = actor.get('name', 'Unknown')
                faction = os.path.basename(os.path.dirname(f_path))
                disposition = 'hostile'
                
                # Biometrics
                hp = actor.get('system', {}).get('derivedStats', {}).get('hp', {}).get('max', 40)
                sp = actor.get('system', {}).get('externalData', {}).get('armor', {}).get('body', {}).get('sp', 7)
                emp = actor.get('system', {}).get('stats', {}).get('emp', {}).get('value', 5)
                
                cursor.execute(
                    "INSERT OR REPLACE INTO npcs (id, name, faction, disposition, hp, sp, emp) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (get_hash(name)[:16], name, faction, disposition, hp, sp, emp)
                )
                npcs_inserted += 1
        except Exception as e:
            pass
    
    print(f"   >> NPCs Restored: {npcs_inserted}")

    # 2. Ingest TTTA Journals as Seeds
    journal_files = glob.glob(os.path.join(TTTA_DIR, '**/*.json'), recursive=True)
    seeds_inserted = 0
    for f_path in journal_files:
        try:
            with open(f_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Handle array or single object
                docs = data if isinstance(data, list) else [data]
                for doc in docs:
                    title = doc.get('name', 'Untitled')
                    content = doc.get('content', '')
                    if not content and 'pages' in doc:
                         content = "\n".join([p.get('text', {}).get('content', '') for p in doc['pages']])
                    
                    if content:
                        cursor.execute(
                            "INSERT OR REPLACE INTO chronicle_seeds (id, title, content, source, category, status, semantic_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
                            (get_hash(title)[:16], title, content, 'FOUNDRY', '#Historical', 'approved', get_hash(content))
                        )
                        seeds_inserted += 1
        except Exception as e:
            pass

    print(f"   >> Seeds Restored: {seeds_inserted}")

    # 3. Restore Triplets (Simplified Harmonization)
    print(">> GENERATING TRIPLETS...")
    cursor.execute("SELECT id, title, content FROM chronicle_seeds")
    seeds = cursor.fetchall()
    triplets_inserted = 0
    for s_id, title, content in seeds:
        # Extract basic triads
        cursor.execute(
            "INSERT INTO triplets (subject_id, predicate, object_literal) VALUES (?, ?, ?)",
            (title, 'description', content[:200])
        )
        triplets_inserted += 1

    conn.commit()
    conn.close()
    print(f"✅ RECOVERY COMPLETE: {npcs_inserted} NPCs, {seeds_inserted} seeds, {triplets_inserted} triplets.")

if __name__ == "__main__":
    ingest_json()
