import { z } from 'zod';

export const CargoCategorySchema = z.enum(['data_runner', 'scarcity_goods', 'military_gear']);
export type CargoCategory = z.infer<typeof CargoCategorySchema>;

export const CargoBulkSchema = z.enum(['physical', 'digital']);
export type CargoBulk = z.infer<typeof CargoBulkSchema>;

export const CargoRaritySchema = z.enum(['common', 'uncommon', 'rare', 'exotic']);
export type CargoRarity = z.infer<typeof CargoRaritySchema>;

export const RedTradeCargoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: CargoCategorySchema,
  bulk: CargoBulkSchema,
  rarity: CargoRaritySchema,
  buyerFaction: z.string().min(1),
  rivalFaction: z.string().min(1),
  sourceItem: z.string().min(1),
});

export type RedTradeCargo = z.infer<typeof RedTradeCargoSchema>;
