import { z } from "zod";

/**
 * Esquema para validar headers de peticiones cron
 * xCronSecret: string opcional que se valida contra env.CRON_SECRET
 */
export const cronCleanupHeadersSchema = z.object({
  xCronSecret: z.string().min(1).optional(),
});

export type CronCleanupHeaders = z.infer<typeof cronCleanupHeadersSchema>;
