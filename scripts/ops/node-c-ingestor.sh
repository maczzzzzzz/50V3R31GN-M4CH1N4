#!/usr/bin/env bash
# scripts/ops/node-c-ingestor.sh
# 50V3R31GN-M4CH1N4: Global PDF Ingestor for Node C

cd ~/50V3R31GN-M4CH1N4
source .venv-ingest/bin/activate

echo "◈ Starting Global Ingestion from docs/raw_data/..."

# Point worker at the root raw_data dir
# The script internally handles recursion and skipping existing shards
python3 scripts/dev/docling-worker.py \
  --source docs/raw_data/ \
  --output data/ingest/pdf_shards/

echo "◈ MISSION_COMPLETE. World-state materialized."
