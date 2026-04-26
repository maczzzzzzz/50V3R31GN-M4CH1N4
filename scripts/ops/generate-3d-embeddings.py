import sqlite3
import numpy as np
import umap
from sentence_transformers import SentenceTransformer
import os

# Config
DB_PATH = "data/SovereignIntelligence.db"
MODEL_NAME = "all-MiniLM-L6-v2"

def main():
    print(">> INITIATING SPATIAL EMBEDDING GENERATION...")
    db = sqlite3.connect(DB_PATH)
    cursor = db.cursor()

    # 1. Prepare Schema
    cursor.execute("CREATE TABLE IF NOT EXISTS spatial_node_mapping (id INTEGER PRIMARY KEY AUTOINCREMENT, source_table TEXT NOT NULL, source_id TEXT NOT NULL, label TEXT, UNIQUE(source_table, source_id))")
    # 3D RTREE: id, minX, maxX, minY, maxY, minZ, maxZ
    cursor.execute("DROP TABLE IF EXISTS spatial_palace_nodes")
    cursor.execute("CREATE VIRTUAL TABLE spatial_palace_nodes USING rtree(id, minX, maxX, minY, maxY, minZ, maxZ)")
    db.commit()

    # 2. Collect Data
    nodes = [] # (source_table, source_id, text_to_embed, label)

    # Shards
    cursor.execute("SELECT id, name, content FROM intelligence_shards")
    for row in cursor.fetchall():
        nodes.append(("intelligence_shards", row[0], f"{row[1]} {row[2]}", row[1]))

    # Triplets (Subjects)
    cursor.execute("SELECT DISTINCT subject_id FROM os_triplets")
    for row in cursor.fetchall():
        nodes.append(("os_triplets_subject", row[0], row[0], row[0]))

    if not nodes:
        print("!! NO DATA FOUND FOR EMBEDDING.")
        return

    print(f">> GATHERED {len(nodes)} NODES. GENERATING EMBEDDINGS...")
    
    # 3. Generate Embeddings
    model = SentenceTransformer(MODEL_NAME)
    texts = [n[2] for n in nodes]
    embeddings = model.encode(texts, show_progress_bar=True)

    print(">> PROJECTING TO 3D SPACE (UMAP)...")
    
    # 4. UMAP Reduction
    reducer = umap.UMAP(
        n_neighbors=15,
        min_dist=0.1,
        n_components=3,
        metric='cosine',
        random_state=42
    )
    coords = reducer.fit_transform(embeddings)

    # Sanitize and Normalize
    if np.any(np.isnan(coords)) or np.any(np.isinf(coords)):
        print("!! WARNING: COORDINATES CONTAIN NAN/INF. SANITIZING...")
        coords = np.nan_to_num(coords)

    # Normalize coords for visibility (e.g. -100 to 100)
    c_min = coords.min(axis=0)
    c_max = coords.max(axis=0)
    # Avoid division by zero
    range_diff = c_max - c_min
    range_diff[range_diff == 0] = 1.0
    coords = (coords - c_min) / range_diff * 200 - 100

    print(">> SHORING SPATIAL NODES TO DATABASE...")

    # 5. Store Results
    for i, (table, sid, text, label) in enumerate(nodes):
        x, y, z = coords[i]
        
        # Ensure strict min <= max for RTREE
        eps = 0.01
        x1, x2 = float(x-eps), float(x+eps)
        y1, y2 = float(y-eps), float(y+eps)
        z1, z2 = float(z-eps), float(z+eps)

        # Final safety check
        if any(np.isnan([x1, x2, y1, y2, z1, z2])):
            continue

        # Insert mapping
        cursor.execute("INSERT OR IGNORE INTO spatial_node_mapping (source_table, source_id, label) VALUES (?, ?, ?)", (table, sid, label))
        cursor.execute("SELECT id FROM spatial_node_mapping WHERE source_table=? AND source_id=?", (table, sid))
        map_id = cursor.fetchone()[0]

        # Insert RTREE
        cursor.execute("INSERT INTO spatial_palace_nodes (id, minX, maxX, minY, maxY, minZ, maxZ) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (map_id, x1, x2, y1, y2, z1, z2))

    db.commit()
    db.close()
    print(f"✅ SPATIAL MEMORY SYNTHESIZED: {len(nodes)} nodes shored in 3D grid.")

if __name__ == "__main__":
    main()
