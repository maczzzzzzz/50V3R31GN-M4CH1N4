import os
import re

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_materialized"
FOOTER = "\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. THE_HISTORY_IS_OURS. // [[Sovereign_OS]]**"

def seal_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Avoid duplicate seals
    if "ARTERY_SEALED" in content:
        return

    # Replace legacy [label](./file.md) with Obsidian [[file.md|label]]
    # This specifically targets the common markdown link pattern
    new_content = re.sub(r'\[([^\]]+)\]\(\.\/([^\)]+)\.md\)', r'[[\2.md|\1]]', content)
    
    # Add the universal footer back-link
    new_content += FOOTER
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

def generate_index(directory, title):
    files = [f for f in os.listdir(directory) if f.endswith(".md") and f != "INDEX.md" and f != "README.md"]
    files.sort()
    
    index_path = os.path.join(directory, "INDEX.md")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(f"# ◈ INDEX : {title}\n\n")
        for file in files:
            name = file.replace(".md", "").replace("-", " ").upper()
            f.write(f"- [[{file}|{name}]]\n")
        f.write(FOOTER)

def main():
    print("::/5Y573M-N071C3 : INITIATING_LINK_SEALING_OPERATION...")
    
    # 1. Walk and Seal all .md files
    for root, dirs, files in os.walk(VAULT_ROOT):
        for file in files:
            if file.endswith(".md"):
                seal_file(os.path.join(root, file))
    
    # 2. Generate missing indices
    generate_index(os.path.join(VAULT_ROOT, "superpowers/shards"), "INTELLIGENCE_SHARDS")
    generate_index(os.path.join(VAULT_ROOT, "superpowers/specs"), "SYSTEM_SPECIFICATIONS")
    generate_index(os.path.join(VAULT_ROOT, "superpowers/plans"), "IMPLEMENTATION_PLANS")
    generate_index(os.path.join(VAULT_ROOT, "superpowers/archive/audits"), "HISTORICAL_AUDITS")
    generate_index(os.path.join(VAULT_ROOT, "sim"), "SIMULATION_RECORDS")
    
    print("::/5Y573M-N071C3 : LINK_SEALING_COMPLETE. BRAIN_COHESIVE.")

if __name__ == "__main__":
    main()
