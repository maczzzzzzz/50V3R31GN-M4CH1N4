import os

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_materialized"

def main():
    print("::/5Y573M-N071C3 : EXECUTING_CLEAN_RELATIONAL_SEAL...")
    
    # 1. Clean Staging Area (Purge binary dumps to keep it lean for now)
    for root, dirs, files in os.walk(VAULT_ROOT):
        for file in files:
            if file.endswith(".sql"):
                os.remove(os.path.join(root, file))

    # 2. Walk all directories and create relative FOLDER_MAPS
    for root, dirs, files in os.walk(VAULT_ROOT):
        md_files = [f for f in files if f.endswith(".md") and f not in ["Sovereign_OS.md", "README.md", "FOLDER_MAP.md", "MASTER_GRAPH.md", "CENTRAL_MAP.md", "MASTER_VAULT_INDEX.md"]]
        
        if md_files:
            map_path = os.path.join(root, "FOLDER_MAP.md")
            with open(map_path, "w", encoding='utf-8') as f:
                f.write(f"# ◈ SECTOR_MAP : {os.path.basename(root).upper()}\n\n")
                f.write("Local shards in this artery:\n\n")
                for md in sorted(md_files):
                    name = md.replace(".md", "")
                    # RELATIVE LINK (Sibling)
                    f.write(f"- [[{name}|{name.upper()}]]\n")
                f.write(f"\n\n---\n[[Sovereign_OS|Back to Central Artery]]")

        # 3. Add relative breadcrumbs to every MD file
        rel_dir = os.path.relpath(root, VAULT_ROOT).replace("\\", "/")
        for file in files:
            if file.endswith(".md") and file != "FOLDER_MAP.md":
                path = os.path.join(root, file)
                with open(path, "r", encoding='utf-8') as f:
                    content_lines = f.readlines()
                
                # Strip old headers
                clean_lines = [l for l in content_lines if not l.startswith("◈ ARTERY:") and not l.startswith("◈ NAVIGATION:") and "ARTERY_SEALED" not in l]
                
                # Find path to root for the link
                levels = rel_dir.count('/') + (1 if rel_dir != "." else 0)
                root_link = "[[Sovereign_OS]]" # Obsidian handles root links from anywhere
                
                header = f"◈ ARTERY: {root_link} > [[FOLDER_MAP|{os.path.basename(root).upper()}]]\n\n---\n\n"
                footer = f"\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. // [[Sovereign_OS]]**"
                
                with open(path, "w", encoding='utf-8') as f:
                    f.write(header + "".join(clean_lines).strip() + footer)

    print("::/5Y573M-N071C3 : CLEAN_RELATIONAL_SEAL_COMPLETE.")

if __name__ == "__main__":
    main()
