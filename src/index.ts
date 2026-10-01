import { getConfig } from './config/index.js';
import { disconnectDb, healthCheck } from './db/client.js';
import { createChildLogger } from './shared/logger.js';
import { createEmailWorker } from './workers/email-worker.js';
import { createJobProcessor } from './workers/processor.js';

const logger = createChildLogger('main');

async function main(): Promise<void> {
  logger.info('Starting JobScout');

  const config = getConfig();

  logger.info('Checking database connection');
  const dbHealthy = await healthCheck();
  if (!dbHealthy) {
    logger.error('Database connection failed');
    process.exit(1);
  }
  logger.info('Database connected');

  const emailWorker = createEmailWorker({
    gmail: {
      clientId: config.gmail.clientId,
      clientSecret: config.gmail.clientSecret,
      refreshToken: config.gmail.refreshToken,
    },
    pollIntervalMs: config.worker.emailPollIntervalMs,
    maxEmailsPerPoll: config.worker.maxJobsPerBatch,
  });

  const jobProcessor = createJobProcessor({
    openai: {
      apiKey: config.openai.apiKey,
      model: config.openai.model,
    },
    telegram: {
      botToken: config.telegram.botToken,
      chatId: config.telegram.chatId,
    },
    batchSize: config.worker.maxJobsPerBatch,
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    await emailWorker.stop();
    await jobProcessor.stop();
    await disconnectDb();

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await Promise.all([emailWorker.start(), jobProcessor.start()]);
}

main().catch((error) => {
  logger.fatal({ error }, 'Fatal error');
  process.exit(1);
});
