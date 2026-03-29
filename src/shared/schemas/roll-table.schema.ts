import { z } from 'zod';
import { FoundryBaseDocumentSchema, FoundryFlagsSchema } from './common.schema.js';

const RollTableResultSchema = z.object({
  type: z.enum(['text', 'document', 'compendium']),
  weight: z.number(),
  range: z.tuple([z.number(), z.number()]),
  drawn: z.boolean(),
  text: z.string(),
  _id: z.string(),
  documentId: z.string().nullable().optional(),
  img: z.string().optional(),
  flags: FoundryFlagsSchema.optional(),
}).passthrough();

export const RollTableSchema = FoundryBaseDocumentSchema.extend({
  formula: z.string(),
  description: z.string().optional(),
  replacement: z.boolean(),
  displayRoll: z.boolean(),
  results: z.array(RollTableResultSchema),
  img: z.string().optional(),
}).passthrough();

export { RollTableResultSchema };
