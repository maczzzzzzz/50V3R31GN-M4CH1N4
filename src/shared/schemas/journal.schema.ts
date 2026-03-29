import { z } from 'zod';
import {
  FoundryBaseDocumentSchema,
  FoundryFlagsSchema,
  FoundryOwnershipSchema,
  FoundryStatsSchema,
} from './common.schema.js';

const JournalPageTextSchema = z.object({
  format: z.number(),
  content: z.string(),
}).passthrough();

const JournalPageSchema = z.object({
  sort: z.number(),
  name: z.string(),
  type: z.enum(['text', 'image', 'video']),
  _id: z.string(),
  title: z.object({
    show: z.boolean(),
    level: z.number(),
  }).optional(),
  text: JournalPageTextSchema.optional(),
  image: z.unknown().optional(),
  video: z.unknown().optional(),
  src: z.string().nullable().optional(),
  system: z.unknown().optional(),
  ownership: FoundryOwnershipSchema.optional(),
  flags: FoundryFlagsSchema.optional(),
  _stats: FoundryStatsSchema.optional(),
}).passthrough();

export const JournalEntrySchema = FoundryBaseDocumentSchema.extend({
  pages: z.array(JournalPageSchema),
}).passthrough();

export { JournalPageSchema, JournalPageTextSchema };
