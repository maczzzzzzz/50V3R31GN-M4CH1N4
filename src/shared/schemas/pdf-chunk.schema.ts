import { z } from 'zod';

export const NamespaceEnum = z.enum([
  'core_rules',
  'campaign_ttta',
  'entities_mooks',
]);

export const PdfChunkSchema = z.object({
  sourceFile: z.string().min(1),
  sourceRef: z.string().min(1),
  namespace: NamespaceEnum,
  contextType: z.enum(['mechanic', 'lore']),
  capabilityReq: z.string().min(1),
  sectionHeading: z.string().min(1),
  pageStart: z.number().int().nonnegative(),
  pageEnd: z.number().int().nonnegative(),
  content: z.string().min(1),
  chunkIndex: z.number().int().nonnegative(),
  tokenEstimate: z.number().int().nonnegative(),
}).refine(
  (data) => data.pageEnd >= data.pageStart,
  { message: 'pageEnd must be >= pageStart' },
);
