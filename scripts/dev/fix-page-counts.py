import json
import os
import subprocess
import re
from pathlib import Path

SHARD_DIR = Path("data/ingest/pdf_shards")
PDF_DIR = Path("docs/raw_data/core_rules")

def get_pdf_page_count(pdf_path):
    try:
        result = subprocess.run(["pdfinfo", str(pdf_path)], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            m = re.search(r"Pages:\s+(\d+)", result.stdout)
            if m:
                return int(m.group(1))
    except:
        pass
    return 1

def main():
    print("::/RE-CALIBRATING PAGE COUNTS")
    for json_file in SHARD_DIR.glob("*.json"):
        with open(json_file, "r") as f:
            data = json.load(f)
        
        pdf_name = data.get("source")
        # Find PDF path
        pdf_path = None
        for p in PDF_DIR.rglob(pdf_name):
            pdf_path = p
            break
        
        if not pdf_path:
            # Try to use source_path from JSON
            pdf_path = Path(data.get("source_path"))

        if pdf_path and pdf_path.exists():
            old_count = data.get("page_count", 0)
            new_count = get_pdf_page_count(pdf_path)
            if old_count != new_count:
                print(f"  [fixed] {pdf_name}: {old_count} -> {new_count}")
                data["page_count"] = new_count
                with open(json_file, "w") as f:
                    json.dump(data, f, indent=2)
            else:
                print(f"  [ok] {pdf_name}: {new_count}")
        else:
            print(f"  [MISSING] PDF for {pdf_name}")

if __name__ == "__main__":
    main()
