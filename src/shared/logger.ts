import pino from 'pino';

const level = process.env['LOG_LEVEL'] || 'info';
const isTest = process.env['NODE_ENV'] === 'test' || process.env['VITEST'];

export const logger = pino({
  level: isTest ? 'silent' : level,
  transport:
    !isTest && process.env['NODE_ENV'] !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard',
          },
        }
      : undefined,
  base: isTest
    ? undefined
    : {
        env: process.env['NODE_ENV'] || 'development',
      },
});

export function createChildLogger(module: string) {
  return logger.child({ module });
}

export type Logger = pino.Logger;
