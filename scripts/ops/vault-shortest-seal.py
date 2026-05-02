import os

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_materialized"

def main():
    print("::/5Y573M-N071C3 : EXECUTING_SHORTEST_PATH_SEALING...")
    
    all_files_short = []
    for root, dirs, files in os.walk(VAULT_ROOT):
        for file in files:
            if file.endswith(".md") and file not in ["Sovereign_OS.md", "CENTRAL_MAP.md", "FOLDER_MAP.md", "MASTER_GRAPH.md", "README.md"]:
                name = file.replace(".md", "")
                all_files_short.append(name)

    # 1. Update EVERY markdown file with SHORTEST PATH breadcrumbs and footers
    for root, dirs, files in os.walk(VAULT_ROOT):
        for file in files:
            if file.endswith(".md"):
                path = os.path.join(root, file)
                
                with open(path, "r", encoding='utf-8') as f:
                    lines = f.readlines()
                
                # Strip system markers
                content = "".join([l for l in lines if not l.startswith("◈ ARTERY:") and "ARTERY_SEALED" not in l and "Sector Map:" not in l]).strip()
                
                # Shortest path nav
                nav = "◈ ARTERY: [[Sovereign_OS]]"
                footer = f"\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. // [[Sovereign_OS]]**"
                
                with open(path, "w", encoding='utf-8') as f:
                    f.write(f"{nav}\n\n---\n\n{content}{footer}")

    # 2. Giant Flat Index
    with open(os.path.join(VAULT_ROOT, "MASTER_VAULT_INDEX.md"), "w", encoding='utf-8') as f:
        f.write("# ◈ MASTER_VAULT_INDEX\n\n")
        f.write("Flat relational list of all system shards. No orphans allowed.\n\n")
        for name in sorted(all_files_short):
            f.write(f"- [[{name}]]\n")
        f.write("\n\n---\n[[Sovereign_OS]]")

    # 3. Update Sovereign_OS.md
    with open(os.path.join(VAULT_ROOT, "Sovereign_OS.md"), "a", encoding='utf-8') as f:
        f.write("\n- [[MASTER_VAULT_INDEX|MASTER VAULT INDEX]] (Exhaustive Flat List)\n")

    print(f"::/5Y573M-N071C3 : SHORTEST_PATH_SEALING_COMPLETE. Total Shards: {len(all_files_short)}")

if __name__ == "__main__":
    main()
