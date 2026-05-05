import { z } from "zod";

export const cronCleanupHeadersSchema = z.object({
  xCronSecret: z.string().min(1).optional(),
});

export type CronCleanupHeaders = z.infer<typeof cronCleanupHeadersSchema>;