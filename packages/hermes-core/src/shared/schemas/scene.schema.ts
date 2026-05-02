import { z } from 'zod';
import { FoundryBaseDocumentSchema, FoundryFlagsSchema } from './common.schema.js';

const SceneBackgroundSchema = z.object({
  src: z.string(),
  scaleX: z.number(),
  scaleY: z.number(),
  offsetX: z.number(),
  offsetY: z.number(),
  rotation: z.number(),
  anchorX: z.number().optional(),
  anchorY: z.number().optional(),
  fit: z.string(),
  tint: z.string().nullable(),
  alphaThreshold: z.number(),
}).passthrough();

const SceneGridSchema = z.object({
  type: z.number(),
  size: z.number(),
  color: z.string(),
  alpha: z.number(),
  distance: z.number(),
  units: z.string(),
  style: z.string(),
  thickness: z.number(),
});

const SceneWallSchema = z.object({
  c: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  _id: z.string(),
  light: z.number(),
  move: z.number(),
  sight: z.number(),
  sound: z.number(),
  dir: z.number(),
  door: z.number(),
  ds: z.number(),
  threshold: z.object({
    light: z.number().nullable(),
    sight: z.number().nullable(),
    sound: z.number().nullable(),
    attenuation: z.boolean(),
  }).passthrough(),
  flags: FoundryFlagsSchema.optional(),
});

const SceneLightConfigSchema = z.object({
  alpha: z.number(),
  angle: z.number(),
  bright: z.number(),
  dim: z.number(),
  color: z.string().nullable(),
  coloration: z.number(),
  luminosity: z.number(),
  saturation: z.number(),
  contrast: z.number(),
  shadows: z.number(),
  animation: z.object({
    type: z.string().nullable(),
    speed: z.number(),
    intensity: z.number(),
    reverse: z.boolean(),
  }).passthrough(),
  darkness: z.object({
    min: z.number(),
    max: z.number(),
  }),
  attenuation: z.number(),
  negative: z.boolean(),
  priority: z.number(),
}).passthrough();

const SceneLightSchema = z.object({
  _id: z.string(),
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  walls: z.boolean(),
  vision: z.boolean(),
  config: SceneLightConfigSchema,
  hidden: z.boolean(),
  elevation: z.number(),
  flags: FoundryFlagsSchema.optional(),
});

const SceneTileTextureSchema = z.object({
  src: z.string().nullable(),
  scaleX: z.number(),
  scaleY: z.number(),
  tint: z.string().nullable(),
  offsetX: z.number(),
  offsetY: z.number(),
  rotation: z.number(),
  anchorX: z.number(),
  anchorY: z.number(),
  fit: z.string(),
  alphaThreshold: z.number(),
}).passthrough();

const SceneTileSchema = z.object({
  texture: SceneTileTextureSchema,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number(),
  alpha: z.number(),
  occlusion: z.object({
    mode: z.number(),
    alpha: z.number(),
  }).passthrough(),
  flags: FoundryFlagsSchema.optional(),
}).passthrough();

const SceneTokenSchema = z.object({
  name: z.string(),
  x: z.number(),
  y: z.number(),
}).passthrough();

const GlobalLightSchema = z.object({
  luminosity: z.number(),
  enabled: z.boolean(),
  darkness: z.object({
    max: z.number(),
    min: z.number(),
  }),
  alpha: z.number(),
  bright: z.boolean(),
  color: z.string().nullable(),
  coloration: z.number(),
  saturation: z.number(),
  contrast: z.number(),
  shadows: z.number(),
}).passthrough();

const EnvironmentLevelSchema = z.object({
  hue: z.number(),
  intensity: z.number(),
  luminosity: z.number(),
  saturation: z.number(),
  shadows: z.number(),
});

const SceneEnvironmentSchema = z.object({
  globalLight: GlobalLightSchema,
  darknessLevel: z.number(),
  darknessLock: z.boolean(),
  cycle: z.boolean(),
  base: EnvironmentLevelSchema,
  dark: EnvironmentLevelSchema,
}).passthrough();

const SceneFogSchema = z.object({
  exploration: z.boolean(),
  reset: z.number().nullable(),
  overlay: z.string().nullable(),
  colors: z.object({
    explored: z.string().nullable(),
    unexplored: z.string().nullable(),
  }),
}).passthrough();

export const SceneSchema = FoundryBaseDocumentSchema.extend({
  navigation: z.boolean(),
  navOrder: z.number(),
  navName: z.string(),
  background: SceneBackgroundSchema,
  foreground: z.string().nullable().optional(),
  foregroundElevation: z.number().optional(),
  width: z.number(),
  height: z.number(),
  padding: z.number(),
  initial: z.object({
    x: z.number().nullable(),
    y: z.number().nullable(),
    scale: z.number().nullable(),
  }),
  backgroundColor: z.string(),
  grid: SceneGridSchema,
  tokenVision: z.boolean(),
  environment: SceneEnvironmentSchema,
  fog: SceneFogSchema,
  weather: z.string().nullable().optional(),
  walls: z.array(SceneWallSchema),
  lights: z.array(SceneLightSchema),
  tiles: z.array(SceneTileSchema),
  tokens: z.array(SceneTokenSchema),
  drawings: z.array(z.unknown()),
  sounds: z.array(z.unknown()),
  notes: z.array(z.unknown()),
  templates: z.array(z.unknown()),
  regions: z.array(z.unknown()),
  playlist: z.string().nullable().optional(),
  playlistSound: z.string().nullable().optional(),
  journal: z.string().nullable().optional(),
  journalEntryPage: z.string().nullable().optional(),
  thumb: z.string().nullable().optional(),
}).passthrough();

export {
  SceneBackgroundSchema,
  SceneGridSchema,
  SceneWallSchema,
  SceneLightSchema,
  SceneTileSchema,
  SceneTokenSchema,
  SceneEnvironmentSchema,
  SceneFogSchema,
};
