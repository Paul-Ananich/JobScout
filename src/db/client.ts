import { PrismaClient } from '@prisma/client';

import { createChildLogger } from '../shared/logger.js';

const logger = createChildLogger('database');

let prisma: PrismaClient | undefined;

export function getDbClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        process.env['NODE_ENV'] === 'development'
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'warn' },
            ]
          : [{ emit: 'event', level: 'error' }],
    });

    if (process.env['NODE_ENV'] === 'development') {
      prisma.$on('query' as never, (e: { query: string; duration: number }) => {
        logger.debug({ query: e.query, duration: e.duration }, 'Database query');
      });
    }

    prisma.$on('error' as never, (e: { message: string }) => {
      logger.error({ error: e.message }, 'Database error');
    });
  }

  return prisma;
}

export async function disconnectDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    await getDbClient().$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error({ error }, 'Database health check failed');
    return false;
  }
}
