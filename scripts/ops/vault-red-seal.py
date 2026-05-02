import os

VAULT_ROOT = "/home/nixos/.gemini/tmp/vault_red_materialized"
FOOTER = "\n\n---\n**::/5Y573M-N071C3 : ARTERY_SEALED. // [[Cyberpunk_RED]]**"

def main():
    for root, dirs, files in os.walk(VAULT_ROOT):
        for file in files:
            if file.endswith(".md"):
                path = os.path.join(root, file)
                with open(path, "r", encoding='utf-8') as f:
                    content = f.read()
                
                # Strip system headers and old footers
                clean = content.split("---")[0].strip() if "---" in content else content.strip()
                
                with open(path, "w", encoding='utf-8') as f:
                    f.write(clean + FOOTER)

if __name__ == "__main__":
    main()
