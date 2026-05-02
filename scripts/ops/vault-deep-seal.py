import os

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_materialized"
FOOTER = "\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. THE_HISTORY_IS_OURS. // [[Sovereign_OS]]**"

def main():
    print("::/5Y573M-N071C3 : INITIATING_DEEP_LINK_SEALING...")
    
    all_links = []
    
    # 1. Gather all files and add footer to each
    for root, dirs, files in os.walk(VAULT_ROOT):
        for file in files:
            if file.endswith(".md"):
                rel_path = os.path.relpath(os.path.join(root, file), VAULT_ROOT).replace("\\", "/")
                # Create wikilink
                link = f"[[{rel_path}|{file.replace('.md', '').upper()}]]"
                all_links.append((rel_path, link))
                
                # Add footer to the file itself
                with open(os.path.join(root, file), 'a+', encoding='utf-8') as f:
                    f.seek(0)
                    content = f.read()
                    if "ARTERY_SEALED" not in content:
                        f.write(FOOTER)

    # 2. Generate the CENTRAL_MAP.md
    with open(os.path.join(VAULT_ROOT, "CENTRAL_MAP.md"), "w", encoding='utf-8') as f:
        f.write("# ◈ CENTRAL_ARTERY_MAP\n\n")
        f.write("This map contains a physicalized link to every shard in the Sovereign Mind. Zero orphans allowed.\n\n")
        
        # Group by directory
        current_dir = ""
        for rel_path, link in sorted(all_links):
            dir_name = os.path.dirname(rel_path)
            if dir_name != current_dir:
                current_dir = dir_name
                f.write(f"\n## 📂 {dir_name if dir_name else 'ROOT'}\n")
            f.write(f"- {link}\n")
            
        f.write(FOOTER)
    
    # 3. Update Sovereign_OS.md to include the map
    with open(os.path.join(VAULT_ROOT, "Sovereign_OS.md"), "a", encoding='utf-8') as f:
        f.write("\n\n## 🗺️ NAVIGATIONAL_MAP\n- [[CENTRAL_MAP.md|CENTRAL ARTERY MAP]] (Exhaustive Shard List)\n")

    print(f"::/5Y573M-N071C3 : DEEP_SEALING_COMPLETE. Total Shards: {len(all_links)}")

if __name__ == "__main__":
    main()
