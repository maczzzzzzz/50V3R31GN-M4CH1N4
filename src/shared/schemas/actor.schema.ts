import { z } from 'zod';
import { FoundryBaseDocumentSchema } from './common.schema.js';

const StatValueSchema = z.object({
  value: z.number(),
});

const StatWithMaxSchema = z.object({
  value: z.number(),
  max: z.number(),
});

const TransactionSchema = z.record(z.string(), z.unknown());

const ActorStatsSchema = z.object({
  int: StatValueSchema,
  ref: StatValueSchema,
  dex: StatValueSchema,
  tech: StatValueSchema,
  cool: StatValueSchema,
  will: StatValueSchema,
  luck: StatWithMaxSchema,
  move: StatValueSchema,
  body: StatValueSchema,
  emp: StatWithMaxSchema,
});

const WoundState = z.enum([
  'notWounded',
  'lightlyWounded',
  'seriouslyWounded',
  'mortallyWounded',
  'dead',
]);

const DerivedStatsSchema = z.object({
  hp: z.object({
    value: z.number(),
    max: z.number(),
    transactions: z.array(TransactionSchema).optional(),
  }),
  humanity: z.object({
    value: z.number(),
    max: z.number(),
    transactions: z.array(TransactionSchema).optional(),
  }),
  deathSave: z.object({
    value: z.number(),
    penalty: z.number(),
    basePenalty: z.number(),
  }),
  currentWoundState: WoundState,
  seriouslyWounded: z.number(),
  walk: StatValueSchema,
  run: StatValueSchema,
});

const ActorRoleInfoSchema = z.object({
  activeRole: z.string(),
  activeNetRole: z.string(),
}).passthrough();

const ActorInformationSchema = z.object({
  alias: z.string(),
  description: z.string(),
  notes: z.string(),
  history: z.string(),
}).passthrough();

const ActorSystemSchema = z.object({
  stats: ActorStatsSchema,
  derivedStats: DerivedStatsSchema,
  roleInfo: ActorRoleInfoSchema,
  information: ActorInformationSchema,
  externalData: z.record(z.string(), z.unknown()).optional(),
  reputation: z.unknown().optional(),
  installedItems: z.unknown().optional(),
  weapons: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

export const ActorSchema = FoundryBaseDocumentSchema.extend({
  type: z.enum(['character', 'mook']),
  img: z.string().optional(),
  system: ActorSystemSchema,
  items: z.array(z.unknown()).optional(),
  prototypeToken: z.unknown().optional(),
  effects: z.array(z.unknown()).optional(),
}).passthrough();

export {
  StatValueSchema,
  StatWithMaxSchema,
  ActorStatsSchema,
  DerivedStatsSchema,
  WoundState,
  ActorSystemSchema,
};
