import os

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_materialized"

def get_breadcrumbs(rel_path):
    parts = rel_path.split('/')
    if len(parts) <= 1:
        return "[[Sovereign_OS]]"
    
    crumbs = ["[[Sovereign_OS]]"]
    current = ""
    for part in parts[:-1]:
        current = os.path.join(current, part).replace("\\", "/")
        # Try to find a map or summary for this folder
        crumbs.append(f"[[{current}/FOLDER_MAP|{part.upper()}]]")
    
    return " > ".join(crumbs)

def main():
    print("::/5Y573M-N071C3 : EXECUTING_MASTER_SEAL_OPERATION...")
    
    for root, dirs, files in os.walk(VAULT_ROOT):
        for file in files:
            if file.endswith(".md"):
                path = os.path.join(root, file)
                rel_path = os.path.relpath(path, VAULT_ROOT).replace("\\", "/")
                
                with open(path, "r", encoding='utf-8') as f:
                    lines = f.readlines()
                
                # Filter out existing breadcrumbs or footers to avoid stacking
                content_lines = [l for l in lines if "◈ NAVIGATION:" not in l and "ARTERY_SEALED" not in l and "Sector Map:" not in l]
                
                # Breadcrumb at top
                header = f"◈ NAVIGATION: {get_breadcrumbs(rel_path)}\n\n---\n\n"
                
                # Unified footer
                footer = f"\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. THE_HISTORY_IS_OURS. // [[Sovereign_OS]]**"
                
                with open(path, "w", encoding='utf-8') as f:
                    f.write(header)
                    f.writelines(content_lines)
                    f.write(footer)

    print("::/5Y573M-N071C3 : MASTER_SEAL_COMPLETE.")

if __name__ == "__main__":
    main()
