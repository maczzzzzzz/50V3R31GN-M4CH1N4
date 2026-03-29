import { z } from 'zod';
import { FoundryBaseDocumentSchema, FoundrySourceSchema } from './common.schema.js';

const ItemDescriptionSchema = z.object({
  value: z.string(),
}).passthrough();

const ItemPriceSchema = z.object({
  market: z.number(),
}).passthrough();

const ItemConcealableSchema = z.object({
  concealable: z.boolean(),
  isConcealed: z.boolean(),
});

const ItemInstalledItemsSchema = z.object({
  allowedTypes: z.array(z.string()),
  allowed: z.boolean(),
  list: z.array(z.unknown()),
  usedSlots: z.number(),
  slots: z.number(),
});

const BaseItemSystemSchema = z.object({
  description: ItemDescriptionSchema,
  source: FoundrySourceSchema,
  favorite: z.boolean(),
  revealed: z.boolean().optional(),
}).passthrough();

export const ItemSchema = FoundryBaseDocumentSchema.extend({
  type: z.string(),
  img: z.string().optional(),
  system: BaseItemSystemSchema,
  effects: z.array(z.unknown()).optional(),
  sort: z.number().optional(),
  ownership: z.record(z.string(), z.number()).optional(),
}).passthrough();

export { BaseItemSystemSchema, ItemDescriptionSchema, ItemPriceSchema, ItemConcealableSchema, ItemInstalledItemsSchema };
