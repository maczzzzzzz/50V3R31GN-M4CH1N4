import { z } from 'zod';
import { NamespaceEnum } from './pdf-chunk.schema.js';

export const RollResultSchema = z.object({
  total: z.number(),
  rolls: z.array(z.number()),
  stat: z.string().optional(),
  skill: z.string().optional(),
  dv: z.number().optional(),
  success: z.boolean(),
  margin: z.number(),
  reasoning: z.string(),
});

export const RagMatchSchema = z.object({
  content: z.string(),
  namespace: NamespaceEnum,
  contextType: z.enum(['mechanic', 'lore']),
  capabilityReq: z.string(),
  sourceFile: z.string(),
  sourceRef: z.string(),
  sectionHeading: z.string(),
  score: z.number().min(0).max(1),
  pageStart: z.number().int().nonnegative(),
  pageEnd: z.number().int().nonnegative(),
});

export const RagQueryResultSchema = z.object({
  matches: z.array(RagMatchSchema),
  query: z.string(),
});

export const NodeAErrorSchema = z.object({
  error: z.literal(true),
  code: z.string(),
  message: z.string(),
  timestamp: z.string(),
});
