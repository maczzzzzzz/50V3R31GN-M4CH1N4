/**
 * Sovereign Sniffer - Browser-based discovery and API reverse-engineering
 *
 * A specialized tool for automated web observation and data extraction
 * built on Stagehand SDK with Zod schema validation.
 *
 * @module sovereign-sniffer
 */

// Export main functions
export { observe, extract, SnifferError } from "./sniffer.js";

// Export types for TypeScript consumers
export type { Stagehand } from "@browserbasehq/stagehand";
