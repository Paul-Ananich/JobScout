import { getDbClient } from '../db/client.js';
import { createChildLogger } from '../shared/logger.js';
import { GmailClient } from '../modules/email/gmail.js';
import { parseLinkedInEmail, isLinkedInJobAlertEmail } from '../modules/parser/linkedin.js';
import { jobService } from '../modules/jobs/service.js';

const logger = createChildLogger('worker:email');

export interface EmailWorkerConfig {
  gmail: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  pollIntervalMs: number;
  maxEmailsPerPoll: number;
}

export class EmailWorker {
  private gmailClient: GmailClient;
  private pollIntervalMs: number;
  private maxEmailsPerPoll: number;
  private isRunning: boolean = false;
  private pollTimer: NodeJS.Timeout | null = null;

  constructor(config: EmailWorkerConfig) {
    this.gmailClient = new GmailClient(config.gmail);
    this.pollIntervalMs = config.pollIntervalMs;
    this.maxEmailsPerPoll = config.maxEmailsPerPoll;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Email worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info({ pollIntervalMs: this.pollIntervalMs }, 'Starting email worker');

    await this.poll();

    this.pollTimer = setInterval(() => {
      void this.poll();
    }, this.pollIntervalMs);
  }

  async stop(): Promise<void> {
    this.isRunning = false;

    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    logger.info('Email worker stopped');
  }

  async poll(): Promise<void> {
    if (!this.isRunning) return;

    logger.debug('Polling for new emails');

    try {
      const emails = await this.gmailClient.fetchUnreadEmails({
        maxResults: this.maxEmailsPerPoll,
      });

      logger.info({ count: emails.length }, 'Fetched emails');

      for (const email of emails) {
        await this.processEmail(email.messageId, email);
      }
    } catch (error) {
      logger.error({ error }, 'Error during email poll');
    }
  }

  private async processEmail(
    messageId: string,
    email: Awaited<ReturnType<GmailClient['fetchUnreadEmails']>>[number]
  ): Promise<void> {
    const db = getDbClient();

    const existing = await db.processedEmail.findUnique({
      where: { messageId },
    });

    if (existing) {
      logger.debug({ messageId }, 'Email already processed');
      return;
    }

    if (!isLinkedInJobAlertEmail(email)) {
      logger.debug({ messageId, subject: email.subject }, 'Not a LinkedIn job alert email');
      await this.gmailClient.markAsRead(messageId);
      return;
    }

    logger.info({ messageId, subject: email.subject }, 'Processing LinkedIn job alert');

    const parseResult = parseLinkedInEmail(email);

    if (!parseResult.success) {
      logger.warn(
        { messageId, errors: parseResult.errors },
        'Failed to parse LinkedIn email'
      );
    }

    const { created, duplicates } = await jobService.processRawJobs(parseResult.jobs);

    await db.processedEmail.create({
      data: {
        messageId,
        threadId: email.threadId,
        subject: email.subject,
        receivedAt: email.date,
        jobsFound: parseResult.jobs.length,
      },
    });

    await this.gmailClient.markAsRead(messageId);

    logger.info(
      {
        messageId,
        jobsFound: parseResult.jobs.length,
        created,
        duplicates,
      },
      'Processed email'
    );
  }
}

export function createEmailWorker(config: EmailWorkerConfig): EmailWorker {
  return new EmailWorker(config);
}
