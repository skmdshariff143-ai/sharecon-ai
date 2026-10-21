import { z } from 'zod';

const ServerConfigSchema = z.object({
  AI_PROVIDER_ENABLED: z.enum(['true', 'false']).default('false'),
  GEMINI_API_KEY: z.string().min(1).optional(),
  ANALYSIS_API_TOKEN: z.string().min(32).optional(),
  APP_ORIGIN: z.url().optional(),
}).refine(env => env.AI_PROVIDER_ENABLED !== 'true' || Boolean(env.GEMINI_API_KEY && env.ANALYSIS_API_TOKEN), {
  message: 'Provider mode requires both provider credentials and an API access token.',
});

export function readServerConfig() {
  // Read only on the server; never serialize this object or include it in logs.
  return ServerConfigSchema.safeParse({
    AI_PROVIDER_ENABLED: process.env.AI_PROVIDER_ENABLED,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    ANALYSIS_API_TOKEN: process.env.ANALYSIS_API_TOKEN || undefined,
    APP_ORIGIN: process.env.APP_ORIGIN || undefined,
  });
}
