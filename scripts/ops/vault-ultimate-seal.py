import os

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_materialized"

def clean_link(rel_path):
    return rel_path.replace(".md", "").replace("\\", "/")

def main():
    print("::/5Y573M-N071C3 : EXECUTING_ULTIMATE_ORPHAN_PURGE...")
    
    all_md_files = []
    for root, dirs, files in os.walk(VAULT_ROOT):
        for file in files:
            if file.endswith(".md") and file not in ["Sovereign_OS.md", "CENTRAL_MAP.md", "FOLDER_MAP.md", "MASTER_GRAPH.md"]:
                all_md_files.append(os.path.relpath(os.path.join(root, file), VAULT_ROOT).replace("\\", "/"))

    # 1. Update EVERY markdown file
    for root, dirs, files in os.walk(VAULT_ROOT):
        rel_dir = os.path.relpath(root, VAULT_ROOT).replace("\\", "/")
        for file in files:
            if file.endswith(".md"):
                path = os.path.join(root, file)
                
                with open(path, "r", encoding='utf-8') as f:
                    lines = f.readlines()
                
                # Strip old system headers
                content = "".join([l for l in lines if not l.startswith("◈ ARTERY:") and "ARTERY_SEALED" not in l and "◈ NAVIGATION:" not in l]).strip()
                
                # Breadcrumbs with ROOT links
                if rel_dir == ".":
                    nav = "◈ ARTERY: [[Sovereign_OS]]"
                else:
                    nav = f"◈ ARTERY: [[Sovereign_OS]] > [[{rel_dir}/FOLDER_MAP|{os.path.basename(root).upper()}]]"
                
                footer = f"\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. // [[Sovereign_OS]]**"
                
                with open(path, "w", encoding='utf-8') as f:
                    f.write(f"{nav}\n\n---\n\n{content}{footer}")

    # 2. Master Graph with recursive listing
    with open(os.path.join(VAULT_ROOT, "MASTER_GRAPH.md"), "w", encoding='utf-8') as f:
        f.write("# ◈ MASTER_GRAPH_INDEX\n\n")
        f.write("Exhaustive relational map of all shards. Zero orphans allowed.\n\n")
        
        current_sector = ""
        for rel_path in sorted(all_md_files):
            sector = os.path.dirname(rel_path)
            if sector != current_sector:
                current_sector = sector
                f.write(f"\n### 📂 Sector: {sector if sector else 'ROOT'}\n")
            
            clean = clean_link(rel_path)
            name = os.path.basename(rel_path).replace(".md", "").replace("-", " ").upper()
            f.write(f"- [[{clean}|{name}]]\n")
            
        f.write(f"\n\n---\n[[Sovereign_OS]]")

    print(f"::/5Y573M-N071C3 : ULTIMATE_SEALING_COMPLETE. Total Shards: {len(all_md_files)}")

if __name__ == "__main__":
    main()
