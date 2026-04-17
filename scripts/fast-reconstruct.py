"""
scripts/fast-reconstruct.py
Phase 57: Vault Reconstruction v2 — District-First Hierarchy + Metadata Mandate.

Hierarchy:
  Districts/<district>/Lore/
  Districts/<district>/Actors/
  Districts/<district>/Items/
  Districts/<district>/Locations/
  Global/Core_Rules/
  Global/Factions/
  Global/History/

Metadata Mandate: every .md file MUST have complete YAML frontmatter:
  provenance, type, source, tags, sovereign, generated_at
"""

import sqlite3
import os
import re
from datetime import datetime, timezone

VAULT_WSL = os.getenv("OBSIDIAN_VAULT_PATH", "/home/nixos/50V3R31GN-M4CH1N4/data/vault/RKG")
DB_PATH = os.getenv("AKASHIK_DB_PATH", "data/Akashik.db")
GENERATED_AT = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def clean_filename(name: str) -> str:
    name = str(name).replace('"', '').replace(' ', '_').replace('/', '_')
    return re.sub(r'[^\w\-_.]', '', name)[:200]


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def district_root(district: str) -> str:
    """Returns the vault-relative folder for a district (or Global)."""
    if district:
        return os.path.join(VAULT_WSL, "Districts", district)
    return os.path.join(VAULT_WSL, "Global")


def category_to_subfolder(category: str) -> str:
    """Map chronicle category to District-First subfolder."""
    clean = str(category).replace('#', '').strip()
    mapping = {
        "Technical": "Lore",
        "Historical": "Lore",
        "History": "Lore",
        "Gossip": "Lore",
        "Gear": "Items",
        "Corporate": "Factions",
        "Faction": "Factions",
        "Location": "Locations",
    }
    return mapping.get(clean, "Lore")


def write_frontmatter(f, *, subject: str, type_: str, source: str,
                      tags: list[str], district: str = '',
                      extra: dict | None = None) -> None:
    """Write complete YAML frontmatter per Metadata Mandate."""
    f.write("---\n")
    f.write(f"subject: {subject}\n")
    f.write(f"type: {type_}\n")
    f.write(f"source: {source}\n")
    if district:
        f.write(f"district: {district}\n")
    tag_str = "[" + ", ".join(tags) + "]"
    f.write(f"tags: {tag_str}\n")
    f.write(f"sovereign: true\n")
    f.write(f"provenance: AKASHIK_DB\n")
    f.write(f"generated_at: {GENERATED_AT}\n")
    if extra:
        for k, v in extra.items():
            f.write(f"{k}: {v}\n")
    f.write("---\n\n")


def reconstruct_triplets(cursor: sqlite3.Cursor) -> int:
    print(">> RECONSTRUCTING TRIPLET ENTITIES...")
    cursor.execute(
        "SELECT subject_id, predicate, object_literal, COALESCE(district_id, '') "
        "FROM triplets WHERE predicate NOT LIKE 'PURGED_%'"
    )
    count = 0
    for sub, pred, obj, district in cursor.fetchall():
        filename = clean_filename(sub)
        sub_lc = str(sub).lower()

        if any(x in sub_lc for x in ["materials", "shard", "weapon", "armor", "cyberware"]):
            subfolder = "Items"
        elif str(pred).lower() == "is" and any(x in str(obj).lower() for x in ["npc", "actor"]):
            subfolder = "Actors"
        else:
            subfolder = "Lore"

        base_dir = os.path.join(district_root(district), subfolder)
        ensure_dir(base_dir)
        filepath = os.path.join(base_dir, f"{filename}.md")

        mode = "a" if os.path.exists(filepath) else "w"
        with open(filepath, mode) as f:
            if mode == "w":
                write_frontmatter(f,
                    subject=sub, type_="Entity", source="AKASHIK_DB",
                    tags=[f"rkg/{subfolder.lower()}", "provenance/akashik"],
                    district=district)
                f.write(f"# {sub}\n\n### ◈ KNOWLEDGE TRIADS\n")
            f.write(f"- **{pred}** :: [[{obj}]]\n")
        count += 1
    return count


def reconstruct_npcs(cursor: sqlite3.Cursor) -> int:
    print(">> RECONSTRUCTING NPC ENTITIES...")
    cursor.execute(
        "SELECT name, COALESCE(faction,'Independent'), disposition, "
        "COALESCE(district_id,''), id, hp, sp, emp FROM npcs"
    )
    count = 0
    for name, faction, disposition, district, npc_id, hp, sp, emp in cursor.fetchall():
        filename = clean_filename(name)
        base_dir = os.path.join(district_root(district), "Actors")
        ensure_dir(base_dir)
        filepath = os.path.join(base_dir, f"{filename}.md")

        with open(filepath, "w") as f:
            write_frontmatter(f,
                subject=name, type_="Actor", source="AKASHIK_DB",
                tags=[
                    "rkg/actors",
                    f"faction/{faction.lower().replace(' ', '-')}",
                    f"status/{disposition.lower()}",
                ],
                district=district,
                extra={"npc_id": npc_id})
            f.write(f"# {name}\n\n")
            f.write(f"- **Faction:** [[{faction}]]\n")
            f.write(f"- **Disposition:** {disposition}\n")
            f.write(f"- **Status:** Alive\n\n")
            f.write("### ◈ BIOMETRICS\n")
            f.write(f"- **HP:** {hp}  **SP:** {sp}  **EMP:** {emp}\n")
            if district:
                f.write(f"- **District:** [[{district}]]\n")
        count += 1
    return count


def reconstruct_items(cursor: sqlite3.Cursor) -> int:
    print(">> RECONSTRUCTING ITEM ENTITIES...")
    # items table added in Phase 57; may not exist in older DBs
    try:
        cursor.execute(
            "SELECT name, type, COALESCE(category,''), cost, weight, "
            "COALESCE(district_id,''), source FROM items"
        )
    except sqlite3.OperationalError:
        print("   [SKIP] items table not present.")
        return 0

    count = 0
    for name, itype, category, cost, weight, district, source in cursor.fetchall():
        filename = clean_filename(name)
        base_dir = os.path.join(district_root(district), "Items")
        ensure_dir(base_dir)
        filepath = os.path.join(base_dir, f"{filename}.md")

        with open(filepath, "w") as f:
            write_frontmatter(f,
                subject=name, type_="Item", source=source,
                tags=["rkg/items", f"type/{itype.lower()}", f"category/{category.lower()}"],
                district=district)
            f.write(f"# {name}\n\n")
            f.write(f"- **Type:** {itype}\n")
            f.write(f"- **Category:** {category}\n")
            f.write(f"- **Cost:** {cost} eb\n")
            f.write(f"- **Weight:** {weight}\n")
        count += 1
    return count


def reconstruct_chronicles(cursor: sqlite3.Cursor) -> int:
    print(">> RECONSTRUCTING CHRONICLE ENTRIES...")
    cursor.execute(
        "SELECT title, category, source, era_grounding, "
        "COALESCE(district_id,''), content FROM chronicle_seeds WHERE status = 'approved'"
    )
    count = 0
    for title, cat, src, era, district, content in cursor.fetchall():
        filename = clean_filename(title)
        clean_cat = str(cat).replace('#', '').strip()
        subfolder = category_to_subfolder(cat)

        # Global Factions/History → Global/Factions or Global/History
        if not district and clean_cat in ("Corporate", "Faction"):
            base_dir = os.path.join(VAULT_WSL, "Global", "Factions")
        elif not district and clean_cat in ("Historical", "History"):
            base_dir = os.path.join(VAULT_WSL, "Global", "History")
        elif not district and clean_cat == "Technical":
            base_dir = os.path.join(VAULT_WSL, "Global", "Core_Rules")
        else:
            base_dir = os.path.join(district_root(district), subfolder)

        ensure_dir(base_dir)
        filepath = os.path.join(base_dir, f"{filename}.md")

        with open(filepath, "w") as f:
            write_frontmatter(f,
                subject=title, type_="Chronicle", source=src,
                tags=[
                    f"rkg/chronicles/{subfolder.lower()}",
                    f"category/{clean_cat.lower()}",
                    f"era/{era}",
                ],
                district=district,
                extra={"era": era})
            f.write(f"# {title}\n\n{content}\n\n---\n_Source: {src}_\n")
        count += 1
    return count


def reconstruct() -> None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    t = reconstruct_triplets(cursor)
    n = reconstruct_npcs(cursor)
    i = reconstruct_items(cursor)
    c = reconstruct_chronicles(cursor)

    conn.close()
    print(f"✅ RECONSTRUCTION COMPLETE: {t} triplets, {n} NPCs, {i} items, {c} chronicles → {VAULT_WSL}")


if __name__ == "__main__":
    reconstruct()
