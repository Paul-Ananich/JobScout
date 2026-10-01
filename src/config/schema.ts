import { z } from 'zod';

export const configSchema = z.object({
  database: z.object({
    url: z.string().min(1),
  }),
  gmail: z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    redirectUri: z.string().url(),
    refreshToken: z.string().min(1),
  }),
  openai: z.object({
    apiKey: z.string().min(1),
    model: z.string().default('gpt-4o-mini'),
  }),
  telegram: z.object({
    botToken: z.string().min(1),
    chatId: z.string().min(1),
  }),
  app: z.object({
    logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  }),
  worker: z.object({
    emailPollIntervalMs: z.number().int().positive().default(60000),
    maxJobsPerBatch: z.number().int().positive().default(10),
  }),
});

export type Config = z.infer<typeof configSchema>;

export const filterConfigSchema = z.object({
  targetSeniority: z.array(z.string()),
  targetTechStack: z.array(z.string()),
  targetRoles: z.array(z.string()),
  acceptedRemoteTypes: z.array(z.string()),
  userCountry: z.string(),
  acceptedCountries: z.array(z.string()),
});

export type FilterConfigSchema = z.infer<typeof filterConfigSchema>;
