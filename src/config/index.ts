import dotenv from 'dotenv';

import { ConfigError } from '../shared/errors.js';

import { configSchema, type Config } from './schema.js';

dotenv.config();

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (value === undefined) {
    throw new ConfigError(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvVarOptional(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

function getEnvVarInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new ConfigError(`Invalid integer for environment variable: ${name}`);
  }
  return parsed;
}

export function loadConfig(): Config {
  const rawConfig = {
    database: {
      url: getEnvVar('DATABASE_URL'),
    },
    gmail: {
      clientId: getEnvVar('GMAIL_CLIENT_ID'),
      clientSecret: getEnvVar('GMAIL_CLIENT_SECRET'),
      redirectUri: getEnvVar('GMAIL_REDIRECT_URI', 'http://localhost:3000/oauth/callback'),
      refreshToken: getEnvVar('GMAIL_REFRESH_TOKEN'),
    },
    openai: {
      apiKey: getEnvVar('OPENAI_API_KEY'),
      model: getEnvVarOptional('OPENAI_MODEL', 'gpt-4o-mini'),
    },
    telegram: {
      botToken: getEnvVar('TELEGRAM_BOT_TOKEN'),
      chatId: getEnvVar('TELEGRAM_CHAT_ID'),
    },
    app: {
      logLevel: getEnvVarOptional('LOG_LEVEL', 'info'),
      nodeEnv: getEnvVarOptional('NODE_ENV', 'development'),
    },
    worker: {
      emailPollIntervalMs: getEnvVarInt('EMAIL_POLL_INTERVAL_MS', 60000),
      maxJobsPerBatch: getEnvVarInt('MAX_JOBS_PER_BATCH', 10),
    },
  };

  const result = configSchema.safeParse(rawConfig);
  if (!result.success) {
    throw new ConfigError('Invalid configuration', {
      errors: result.error.flatten().fieldErrors,
    });
  }

  return result.data;
}

let cachedConfig: Config | undefined;

export function getConfig(): Config {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

export function resetConfig(): void {
  cachedConfig = undefined;
}
