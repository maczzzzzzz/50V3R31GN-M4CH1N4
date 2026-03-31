import { z } from 'zod';

/**
 * Validated World Command Pattern
 * Used to gate world state updates from LLMs via Zod validation.
 */
export const WorldCommandSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('UPDATE_NPC'),
    target: z.string(), // NPC ID
    data: z.object({
      hp: z.number().optional(),
      sp: z.number().optional(),
      disposition: z.enum(['friendly', 'neutral', 'hostile']).optional(),
      is_alive: z.boolean().optional(),
    }),
  }),
  z.object({
    action: z.literal('ADD_LORE'),
    subject: z.string(),
    predicate: z.string(),
    object: z.string(),
  }),
]);

export type WorldCommand = z.infer<typeof WorldCommandSchema>;
