#!/usr/bin/env python3
"""
scripts/dev/docling-worker.py
Phase 65: Optical Artery — High-fidelity PDF ingestion using Docling.

Iterates over docs/raw_data/core_rules/ (including dlcs/ subdirectory),
extracts Markdown using Docling's multi-column layout analysis, and writes
structured JSON shards to data/ingest/pdf_shards/.

Usage (inside nix develop .#optical):
    python scripts/dev/docling-worker.py [--source PATH] [--output PATH] [--force]
"""

import argparse
import json
import os
import sys
import hashlib
import uuid
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Resolve project root
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT", SCRIPT_DIR.parent.parent))
DEFAULT_SOURCE = PROJECT_ROOT / "docs" / "raw_data" / "core_rules"
DEFAULT_OUTPUT = PROJECT_ROOT / "data" / "ingest" / "pdf_shards"


# ---------------------------------------------------------------------------
# Docling import with fallback
# ---------------------------------------------------------------------------

def import_docling():
    try:
        from docling.document_converter import DocumentConverter
        from docling.datamodel.pipeline_options import PipelineOptions, PdfPipelineOptions
        return DocumentConverter, PipelineOptions, PdfPipelineOptions
    except ImportError:
        return None, None, None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_pdf_page_count(pdf_path: Path) -> int:
    import subprocess
    try:
        result = subprocess.run(
            ["pdfinfo", str(pdf_path)],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            import re
            m = re.search(r"Pages:\s+(\d+)", result.stdout)
            if m:
                return int(m.group(1))
    except Exception:
        pass
    return 0


def extract_with_pdftotext(pdf_path: Path) -> str:
    import subprocess
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), "-"],
            capture_output=True, text=True, timeout=120
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass
    return ""


def text_to_markdown(raw_text: str) -> str:
    """Convert pdftotext output to rough Markdown."""
    lines = raw_text.split("\n")
    md = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            md.append("")
            continue
        if len(stripped) <= 80 and stripped == stripped.upper() and any(c.isalpha() for c in stripped):
            md.append(f"## {stripped}")
        else:
            md.append(stripped)
    return "\n".join(md)


# ---------------------------------------------------------------------------
# Shard splitter
# ---------------------------------------------------------------------------

def split_into_shards(markdown: str, min_words: int = 20, max_words: int = 400) -> list[dict]:
    import re
    heading_re = re.compile(r"^(#{1,3})\s+(.+)$", re.MULTILINE)

    sections = []
    last_end = 0
    last_heading = "Introduction"

    for m in heading_re.finditer(markdown):
        body = markdown[last_end:m.start()].strip()
        if body:
            sections.append((last_heading, body))
        last_heading = m.group(2).strip()
        last_end = m.end()

    body = markdown[last_end:].strip()
    if body:
        sections.append((last_heading, body))

    shards = []
    for heading, content in sections:
        words = content.split()
        if len(words) < min_words:
            continue
        for i in range(0, len(words), max_words):
            chunk_words = words[i:i + max_words]
            chunk_text = " ".join(chunk_words)
            shards.append({
                "shard_id": str(uuid.uuid4()),
                "heading": heading if i == 0 else f"{heading} (cont.)",
                "content": chunk_text,
                "word_count": len(chunk_words),
                "page_hint": None,
            })
    return shards


# ---------------------------------------------------------------------------
# Process
# ---------------------------------------------------------------------------

def process_pdf(pdf_path: Path, output_dir: Path, force: bool = False) -> dict | None:
    stem = pdf_path.stem
    out_file = output_dir / f"{stem}.json"

    if out_file.exists() and not force:
        print(f"  [skip] {pdf_path.name} — shard already exists")
        return None

    print(f"  [proc] {pdf_path.name}...", flush=True)

    DocumentConverter, PipelineOptions, PdfPipelineOptions = import_docling()
    markdown = ""
    page_count = 0

    if DocumentConverter is not None:
        try:
            options = PdfPipelineOptions()
            options.do_ocr = False
            options.do_table_structure = True
            converter = DocumentConverter()
            result = converter.convert(str(pdf_path))
            markdown = result.document.export_to_markdown()
            page_count = getattr(result.document, "page_count", 0) or len(getattr(result.document, "pages", []))
            if page_count == 0:
                page_count = get_pdf_page_count(pdf_path)
            print(f"    docling: {page_count} pages extracted")
        except Exception as e:
            print(f"    docling error: {e} — falling back to pdftotext", file=sys.stderr)
            markdown = ""
            page_count = get_pdf_page_count(pdf_path)

    if not markdown.strip():
        raw = extract_with_pdftotext(pdf_path)
        if not raw.strip():
            print(f"    [warn] No text extracted from {pdf_path.name}", file=sys.stderr)
            return None
        markdown = text_to_markdown(raw)
        if page_count == 0:
            page_count = get_pdf_page_count(pdf_path)
        print(f"    pdftotext fallback: {len(markdown.split())} words, {page_count} pages")

    shards = split_into_shards(markdown)
    if not shards:
        print(f"    [warn] No shards produced for {pdf_path.name}", file=sys.stderr)
        return None

    record = {
        "source": pdf_path.name,
        "source_path": str(pdf_path),
        "processed_at": datetime.now(timezone.utc).isoformat(),
        "page_count": max(page_count, 1),
        "tier": "OFFICIAL_PDF",
        "shard_count": len(shards),
        "shards": shards,
    }

    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text(json.dumps(record, indent=2, ensure_ascii=False))
    print(f"    → {len(shards)} shards → {out_file.name}")
    return record


def discover_pdfs(source_dir: Path) -> list[Path]:
    pdfs = []
    for entry in source_dir.rglob("*.pdf"):
        if entry.suffix == ".pdf" and ":Zone.Identifier" not in str(entry):
            pdfs.append(entry)
    return sorted(pdfs)


def main():
    parser = argparse.ArgumentParser(description="Docling PDF ingestion worker")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--single", type=Path, default=None)
    args = parser.parse_args()

    output_dir = args.output
    output_dir.mkdir(parents=True, exist_ok=True)

    if args.single:
        pdfs = [args.single]
    else:
        if not args.source.exists():
            print(f"ERROR: source directory not found: {args.source}", file=sys.stderr)
            sys.exit(1)
        pdfs = discover_pdfs(args.source)

    if not pdfs:
        print("No PDFs found.", file=sys.stderr)
        sys.exit(0)

    print(f"::/5Y573M-N071C3 : OPTICAL-ARTERY — {len(pdfs)} PDF(s) queued // 50V3R31GN-M4CH1N4")
    total_shards = 0
    processed = 0
    skipped = 0
    errors = 0

    for pdf in pdfs:
        try:
            record = process_pdf(pdf, output_dir, force=args.force)
            if record is None:
                skipped += 1
            else:
                processed += 1
                total_shards += record.get("shard_count", 0)
        except Exception as e:
            print(f"  [ERROR] {pdf.name}: {e}", file=sys.stderr)
            errors += 1

    print(f"\n::/OPTICAL-ARTERY COMPLETE")
    print(f"  Processed: {processed}  Skipped: {skipped}  Errors: {errors}")
    print(f"  Total shards: {total_shards}")


if __name__ == "__main__":
    main()
