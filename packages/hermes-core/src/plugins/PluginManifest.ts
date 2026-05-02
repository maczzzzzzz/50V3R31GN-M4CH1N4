import { z } from "zod";

export const PluginManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  binary: z.string(),
  spiffe_id: z.string(),
  vsb_intents: z.array(z.number()),
  configuration: z.record(z.any()),
});

export type PluginManifest = z.infer<typeof PluginManifestSchema>;
