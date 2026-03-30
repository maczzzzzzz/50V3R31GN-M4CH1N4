// src/scripts/port-to-zeroclaw.ts
//
// CLI entry point: exports all pdf_chunks from Postgres to a .zeroclaw.json
// file suitable for import by `zeroclaw import --file <path>`.
//
// Usage:
//   npx tsx src/scripts/port-to-zeroclaw.ts --output ./export.zeroclaw.json
//   DATABASE_URL=postgres://... npx tsx src/scripts/port-to-zeroclaw.ts
//
// Environment:
//   DATABASE_URL  – Postgres connection string (required)
//   OUTPUT_PATH   – Override output path (default: ./export.zeroclaw.json)
//
// This script is a one-shot migration tool. It is safe to re-run — the
// zeroclaw import command is idempotent (ON CONFLICT UPDATE).

import { PostgresExporter } from '../db/postgres-exporter.js';

async function main(): Promise<void> {
  const databaseUrl = process.env['DATABASE_URL'];
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL environment variable is required.');
    console.error('Example: DATABASE_URL=postgres://user:pass@localhost/db npx tsx src/scripts/port-to-zeroclaw.ts');
    process.exit(1);
  }

  // Parse --output flag or fall back to env / default
  const outputArg = process.argv.find((_arg, i) => process.argv[i - 1] === '--output');
  const outputPath = outputArg ?? process.env['OUTPUT_PATH'] ?? './export.zeroclaw.json';

  console.log(`[port-to-zeroclaw] Connecting to Postgres...`);

  const exporter = new PostgresExporter({ databaseUrl });

  try {
    console.log(`[port-to-zeroclaw] Fetching chunks from pdf_chunks table...`);
    const count = await exporter.writeExport(outputPath);
    console.log(`[port-to-zeroclaw] Exported ${count} chunks → ${outputPath}`);
    console.log(`[port-to-zeroclaw] Next step: zeroclaw import --db rules.db --file ${outputPath}`);
  } finally {
    await exporter.dispose();
  }
}

main().catch((err: unknown) => {
  console.error('[port-to-zeroclaw] Fatal error:', err);
  process.exit(1);
});
