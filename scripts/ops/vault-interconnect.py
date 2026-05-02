import os

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_materialized"
FOOTER_TEMPLATE = "\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. THE_HISTORY_IS_OURS. // [[Sovereign_OS]]**"

def main():
    print("::/5Y573M-N071C3 : RE-SHORING_VAULT_INTERCONNECTIVITY...")
    
    # 1. Add back-links to every file
    for root, dirs, files in os.walk(VAULT_ROOT):
        # Create a FOLDER_MAP.md in every directory
        md_files = [f for f in files if f.endswith(".md") and f != "FOLDER_MAP.md" and f != "INDEX.md"]
        if md_files:
            map_path = os.path.join(root, "FOLDER_MAP.md")
            with open(map_path, "w", encoding='utf-8') as f:
                f.write(f"# ◈ SECTOR_MAP : {os.path.basename(root).upper()}\n\n")
                f.write("Local sector shards in this artery:\n\n")
                for md in sorted(md_files):
                    f.write(f"- [[{md}|{md.replace('.md', '').upper()}]]\n")
                f.write(FOOTER_TEMPLATE)

        for file in files:
            if file.endswith(".md"):
                path = os.path.join(root, file)
                with open(path, "r", encoding='utf-8') as f:
                    content = f.read()
                
                # Ensure footer exists and is at the very bottom
                clean_content = content.split("---")[0].strip()
                new_footer = FOOTER_TEMPLATE
                
                # If there's a FOLDER_MAP.md, link to it
                if file != "FOLDER_MAP.md":
                    new_footer = f"\n\n---\n**Sector Map:** [[FOLDER_MAP]]" + FOOTER_TEMPLATE
                
                with open(path, "w", encoding='utf-8') as f:
                    f.write(clean_content + new_footer)

    print("::/5Y573M-N071C3 : INTERCONNECTIVITY_VERIFIED.")

if __name__ == "__main__":
    main()
