import { getDbClient } from '../db/client.js';
import { createAnalyzerService } from '../modules/analyzer/service.js';
import { matchJob } from '../modules/filters/matcher.js';
import { jobRepository } from '../modules/jobs/repository.js';
import { jobService } from '../modules/jobs/service.js';
import { createTelegramNotifier } from '../modules/telegram/bot.js';
import type { JobNotificationData } from '../modules/telegram/types.js';
import { createChildLogger } from '../shared/logger.js';
import type { SeniorityLevel, RemoteType } from '../shared/types.js';

const logger = createChildLogger('worker:processor');

export interface ProcessorConfig {
  openai: {
    apiKey: string;
    model: string;
  };
  telegram: {
    botToken: string;
    chatId: string;
  };
  batchSize: number;
}

export class JobProcessor {
  private analyzerService: ReturnType<typeof createAnalyzerService>;
  private telegramNotifier: ReturnType<typeof createTelegramNotifier>;
  private batchSize: number;
  private isRunning: boolean = false;

  constructor(config: ProcessorConfig) {
    this.analyzerService = createAnalyzerService(config.openai);
    this.telegramNotifier = createTelegramNotifier(config.telegram);
    this.batchSize = config.batchSize;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Processor is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting job processor');

    await this.processLoop();
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    logger.info('Job processor stopped');
  }

  private async processLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processAnalysisBatch();

        await this.processMatchingBatch();

        await this.processNotificationBatch();

        await new Promise((resolve) => setTimeout(resolve, 5000));
      } catch (error) {
        logger.error({ error }, 'Error in process loop');
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }
  }

  async processAnalysisBatch(): Promise<{ analyzed: number; failed: number }> {
    const jobs = await jobService.getJobsForAnalysis(this.batchSize);

    if (jobs.length === 0) {
      return { analyzed: 0, failed: 0 };
    }

    logger.info({ count: jobs.length }, 'Processing analysis batch');

    return this.analyzerService.processJobBatch(jobs);
  }

  async processMatchingBatch(): Promise<{ matched: number; rejected: number }> {
    const jobs = await jobRepository.findMany(
      { hasAnalysis: true },
      { take: this.batchSize }
    );

    const jobsToMatch = jobs.filter(
      (j) =>
        j.analysis &&
        j.analysis.status === 'completed' &&
        j.analysis.isMatch === false &&
        j.analysis.matchScore === null
    );

    if (jobsToMatch.length === 0) {
      return { matched: 0, rejected: 0 };
    }

    logger.info({ count: jobsToMatch.length }, 'Processing matching batch');

    let matched = 0;
    let rejected = 0;

    for (const job of jobsToMatch) {
      if (!job.analysis) continue;

      const matchResult = matchJob({
        title: job.title,
        company: job.company,
        seniorityLevel: (job.analysis.seniorityLevel as SeniorityLevel) || 'unknown',
        techStack: job.analysis.techStack,
        requiredSkills: job.analysis.requiredSkills,
        remoteType: (job.analysis.remoteType as RemoteType) || 'unknown',
        locationRestrictions: job.analysis.locationRestrictions,
      });

      await jobRepository.updateAnalysis(job.id, {
        isMatch: matchResult.isMatch,
        matchScore: matchResult.score,
        matchReasons: matchResult.matchReasons,
        rejectReasons: matchResult.rejectReasons,
      });

      if (matchResult.isMatch) {
        matched++;
      } else {
        rejected++;
      }
    }

    logger.info({ matched, rejected }, 'Matching batch completed');

    return { matched, rejected };
  }

  async processNotificationBatch(): Promise<{ sent: number; failed: number }> {
    const jobs = await jobService.getMatchedJobsForNotification(this.batchSize);

    if (jobs.length === 0) {
      return { sent: 0, failed: 0 };
    }

    logger.info({ count: jobs.length }, 'Processing notification batch');

    let sent = 0;
    let failed = 0;

    for (const job of jobs) {
      if (!job.analysis) continue;

      const notificationData: JobNotificationData = {
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location ?? undefined,
        url: job.url,
        salary: job.salary ?? undefined,
        seniorityLevel: job.analysis.seniorityLevel ?? undefined,
        techStack: job.analysis.techStack,
        remoteType: job.analysis.remoteType ?? undefined,
        matchScore: job.analysis.matchScore ?? undefined,
        matchReasons: job.analysis.matchReasons,
      };

      const result = await this.telegramNotifier.sendJobNotification(notificationData);

      await getDbClient().notification.create({
        data: {
          jobId: job.id,
          channel: 'telegram',
          messageId: result.messageId?.toString(),
          status: result.success ? 'sent' : 'failed',
          sentAt: result.success ? new Date() : undefined,
          errorMessage: result.error,
        },
      });

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info({ sent, failed }, 'Notification batch completed');

    return { sent, failed };
  }
}

export function createJobProcessor(config: ProcessorConfig): JobProcessor {
  return new JobProcessor(config);
}
