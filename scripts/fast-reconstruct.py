import sqlite3
import os
import re

VAULT_WSL = os.getenv("OBSIDIAN_VAULT_PATH", "/home/nixos/50V3R31GN-M4CH1N4/data/vault/RKG")
DB_PATH = os.getenv("AKASHIK_DB_PATH", "data/Akashik.db")

def clean_filename(name):
    name = str(name).replace('"', '').replace(' ', '_').replace('/', '_')
    return re.sub(r'[^\w\-_.]', '', name)[:200]

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def reconstruct():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Triplets
    print(">> RECONSTRUCTING TRIPLET ENTITIES...")
    cursor.execute("SELECT subject_id, predicate, object_literal, COALESCE(district_id, '') FROM triplets WHERE predicate NOT LIKE 'PURGED_%'")
    for sub, pred, obj, district in cursor.fetchall():
        filename = clean_filename(sub)
        folder = "Knowledge"
        sub_lc = str(sub).lower()
        if any(x in sub_lc for x in ["materials", "shard", "weapon", "armor", "cyberware"]):
            folder = "Items"
        if str(pred).lower() == "is" and any(x in str(obj).lower() for x in ["npc", "actor"]):
            folder = "Actors"
        
        base_dir = os.path.join(VAULT_WSL, "Districts", district, folder) if district else os.path.join(VAULT_WSL, "Global", folder)
        ensure_dir(base_dir)
        filepath = os.path.join(base_dir, f"{filename}.md")
        
        mode = "a" if os.path.exists(filepath) else "w"
        with open(filepath, mode) as f:
            if mode == "w":
                dist_tag = f"district: {district}\n" if district else ""
                f.write(f"---\nsubject: {sub}\ntype: Entity\ntags: [rkg/{folder.lower()}, provenance/akashik]\nsovereign: true\nsource: AKASHIK_DB\n{dist_tag}---\n\n# {sub}\n\n### ◈ KNOWLEDGE TRIADS\n")
            f.write(f"- **{pred}** :: [[{obj}]]\n")

    # 2. NPCs
    print(">> RECONSTRUCTING NPC ENTITIES...")
    cursor.execute("SELECT name, COALESCE(faction,'Independent'), disposition, COALESCE(district_id,''), id FROM npcs")
    for name, faction, disposition, district, npc_id in cursor.fetchall():
        filename = clean_filename(name)
        base_dir = os.path.join(VAULT_WSL, "Districts", district, "Actors") if district else os.path.join(VAULT_WSL, "Global", "Actors")
        ensure_dir(base_dir)
        filepath = os.path.join(base_dir, f"{filename}.md")
        
        with open(filepath, "w") as f:
            dist_tag = f"district: {district}\n" if district else ""
            f.write(f"---\nsubject: {name}\ntype: Actor\ntags: [rkg/actors, faction/{faction.lower()}, status/{disposition.lower()}]\nsovereign: true\nsource: AKASHIK_DB\n{dist_tag}npc_id: {npc_id}\n---\n\n# {name}\n\n- **Faction:** [[{faction}]]\n- **Disposition:** {disposition}\n- **Status:** Alive\n\n### ◈ BIOMETRICS\n- **Location:** [[{district}]]\n- **Grounding:** Physicalized via Phase 58 Audit.\n")

    # 3. Chronicles
    print(">> RECONSTRUCTING CHRONICLE ENTRIES...")
    cursor.execute("SELECT title, category, source, era_grounding, COALESCE(district_id,''), content FROM chronicle_seeds WHERE status = 'approved'")
    for title, cat, src, era, district, content in cursor.fetchall():
        filename = clean_filename(title)
        clean_cat = str(cat).replace('#', '')
        subfolder = "Lore"
        if clean_cat in ["Gear", "Technical"]: subfolder = "Items"
        elif clean_cat == "Corporate": subfolder = "Factions"
        
        base_dir = os.path.join(VAULT_WSL, "Chronicles", "Districts", district, subfolder) if district else os.path.join(VAULT_WSL, "Chronicles", "Global", subfolder)
        ensure_dir(base_dir)
        filepath = os.path.join(base_dir, f"{filename}.md")
        
        with open(filepath, "w") as f:
            dist_tag = f"district: {district}\n" if district else ""
            f.write(f"---\nsubject: {title}\ntype: Chronicle\ntags: [rkg/chronicles/{subfolder.lower()}, {clean_cat}]\nsource: {src}\nera: {era}\n{dist_tag}sovereign: true\n---\n\n# {title}\n\n{content}\n\n---\n_Source: {src}\n")

    conn.close()
    print("✅ RECONSTRUCTION COMPLETE.")

if __name__ == "__main__":
    reconstruct()
