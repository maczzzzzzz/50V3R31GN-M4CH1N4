import os

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_materialized"
FOOTER_BASE = "[[Sovereign_OS]]"

def get_obsidian_link(rel_path):
    # Remove .md extension for Obsidian compatibility
    return rel_path.replace(".md", "")

def main():
    print("::/5Y573M-N071C3 : EXECUTING_FINAL_ORPHAN_PURGE...")
    
    # 1. Create a Master Index (The Brain Map)
    all_files = {}
    for root, dirs, files in os.walk(VAULT_ROOT):
        md_files = [f for f in files if f.endswith(".md") and f not in ["Sovereign_OS.md", "CENTRAL_MAP.md", "FOLDER_MAP.md"]]
        if md_files:
            rel_dir = os.path.relpath(root, VAULT_ROOT).replace("\\", "/")
            if rel_dir == ".": rel_dir = "ROOT"
            all_files[rel_dir] = sorted(md_files)

    # 2. Update every file with correct link syntax
    for root, dirs, files in os.walk(VAULT_ROOT):
        rel_dir = os.path.relpath(root, VAULT_ROOT).replace("\\", "/")
        for file in files:
            if file.endswith(".md"):
                path = os.path.join(root, file)
                rel_path = os.path.relpath(path, VAULT_ROOT).replace("\\", "/")
                
                # Breadcrumb
                parent_link = f"[[{rel_dir}/FOLDER_MAP|{os.path.basename(root).upper()}]]" if rel_dir != "." else "[[Sovereign_OS]]"
                header = f"◈ ARTERY: [[Sovereign_OS]] > {parent_link}\n\n---\n\n"
                
                with open(path, "r", encoding='utf-8') as f:
                    lines = f.readlines()
                
                # Strip old headers/footers
                content = "".join([l for l in lines if "◈ NAVIGATION:" not in l and "◈ ARTERY:" not in l and "ARTERY_SEALED" not in l and "Sector Map:" not in l]).strip()
                
                footer = f"\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. // [[Sovereign_OS]]**"
                
                with open(path, "w", encoding='utf-8') as f:
                    f.write(header + content + footer)

    # 3. Generate Folder Maps that actually link to siblings
    for rel_dir, md_list in all_files.items():
        dir_path = VAULT_ROOT if rel_dir == "ROOT" else os.path.join(VAULT_ROOT, rel_dir)
        map_path = os.path.join(dir_path, "FOLDER_MAP.md")
        with open(map_path, "w", encoding='utf-8') as f:
            f.write(f"# ◈ SECTOR_MAP : {rel_dir.upper()}\n\n")
            for md in md_list:
                link_target = get_obsidian_link(md)
                f.write(f"- [[{link_target}|{md.replace('.md', '').upper()}]]\n")
            f.write(f"\n\n---\n[[Sovereign_OS|Back to Central Artery]]")

    print("::/5Y573M-N071C3 : FINAL_ORPHAN_PURGE_COMPLETE.")

if __name__ == "__main__":
    main()
