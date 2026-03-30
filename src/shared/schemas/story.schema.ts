// src/shared/schemas/story.schema.ts
import { z } from 'zod';

export const StoryStateSchema = z.object({
  currentArc: z.string().min(1),
  currentBeat: z.string().min(1),
  completedBeats: z.array(z.string()),
  worldState: z.record(z.any()),
  eagleBalance: z.number().nonnegative(),
});

export type StoryState = z.infer<typeof StoryStateSchema>;
