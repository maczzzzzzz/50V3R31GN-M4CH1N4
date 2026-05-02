import { z } from 'zod';
import {
  ActorSchema,
  ActorStatsSchema,
  DerivedStatsSchema,
  ItemSchema,
  SceneSchema,
  JournalEntrySchema,
  JournalPageSchema,
  RollTableSchema,
  RollTableResultSchema,
  PdfChunkSchema,
  NamespaceEnum,
  RollResultSchema,
  RagQueryResultSchema,
  RagMatchSchema,
  NodeAErrorSchema,
  SceneWallSchema,
  SceneLightSchema,
  SceneTileSchema,
} from '../schemas/index.js';

// Foundry VTT Document Types
export type Actor = z.infer<typeof ActorSchema>;
export type ActorStats = z.infer<typeof ActorStatsSchema>;
export type DerivedStats = z.infer<typeof DerivedStatsSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type SceneWall = z.infer<typeof SceneWallSchema>;
export type SceneLight = z.infer<typeof SceneLightSchema>;
export type SceneTile = z.infer<typeof SceneTileSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JournalPage = z.infer<typeof JournalPageSchema>;
export type RollTable = z.infer<typeof RollTableSchema>;
export type RollTableResult = z.infer<typeof RollTableResultSchema>;

// Ingestion Pipeline Types
export type PdfChunk = z.infer<typeof PdfChunkSchema>;
export type Namespace = z.infer<typeof NamespaceEnum>;

// Node A Response Types (Zero-Trust)
export type RollResult = z.infer<typeof RollResultSchema>;
export type RagQueryResult = z.infer<typeof RagQueryResultSchema>;
export type RagMatch = z.infer<typeof RagMatchSchema>;
export type NodeAError = z.infer<typeof NodeAErrorSchema>;
