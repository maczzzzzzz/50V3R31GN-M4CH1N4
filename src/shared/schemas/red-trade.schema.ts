import { z } from 'zod';

export const CargoCategorySchema = z.enum(['data_runner', 'scarcity_goods', 'military_gear']);
export type CargoCategory = z.infer<typeof CargoCategorySchema>;

export const CargoBulkSchema = z.enum(['physical', 'digital']);
export type CargoBulk = z.infer<typeof CargoBulkSchema>;

export const CargoRaritySchema = z.enum(['common', 'uncommon', 'rare', 'exotic']);
export type CargoRarity = z.infer<typeof CargoRaritySchema>;

export const FrictionOutcomeSchema = z.enum(['bark', 'gate', 'ambush']);
export type FrictionOutcome = z.infer<typeof FrictionOutcomeSchema>;

export const FrictionRollResultSchema = z.object({
  roll: z.number().int().min(1).max(10),
  friction: z.number().int().min(0).max(10),
  total: z.number().int().min(1).max(20),
  outcome: FrictionOutcomeSchema,
});
export type FrictionRollResult = z.infer<typeof FrictionRollResultSchema>;

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
