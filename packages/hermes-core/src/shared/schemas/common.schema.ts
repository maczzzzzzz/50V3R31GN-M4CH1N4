import { z } from 'zod';

export const FoundryStatsSchema = z.object({
  coreVersion: z.string(),
  systemId: z.string(),
  systemVersion: z.string(),
  createdTime: z.number().nullable().optional(),
  modifiedTime: z.number().nullable().optional(),
  lastModifiedBy: z.string().nullable().optional(),
  compendiumSource: z.unknown().optional(),
  duplicateSource: z.unknown().optional(),
});

export const FoundrySourceSchema = z.object({
  book: z.string(),
  page: z.number(),
});

export const FoundryFlagsSchema = z.record(z.string(), z.unknown());

export const FoundryOwnershipSchema = z.record(z.string(), z.number());

export const FoundryBaseDocumentSchema = z.object({
  name: z.string(),
  folder: z.string().nullable().optional(),
  flags: FoundryFlagsSchema.optional(),
  _stats: FoundryStatsSchema.optional(),
  _id: z.string().optional(),
});
