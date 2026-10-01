import TelegramBot from 'node-telegram-bot-api';

import { createChildLogger } from '../../shared/logger.js';
import { retry } from '../../shared/utils.js';

import { formatJobNotification, createJobKeyboard } from './formatter.js';
import type {
  TelegramConfig,
  SendMessageOptions,
  MessageResult,
  JobNotificationData,
} from './types.js';

const logger = createChildLogger('telegram');

export class TelegramNotifier {
  private bot: TelegramBot;
  private chatId: string;

  constructor(config: TelegramConfig) {
    this.bot = new TelegramBot(config.botToken, { polling: false });
    this.chatId = config.chatId;
  }

  async sendMessage(text: string, options: SendMessageOptions = {}): Promise<MessageResult> {
    const { parseMode = 'HTML', disableWebPagePreview = true, disableNotification = false } =
      options;

    try {
      const result = await retry(
        async () => {
          return this.bot.sendMessage(this.chatId, text, {
            parse_mode: parseMode,
            disable_web_page_preview: disableWebPagePreview,
            disable_notification: disableNotification,
            reply_markup: options.replyMarkup,
          });
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          maxDelayMs: 5000,
        }
      );

      logger.debug({ messageId: result.message_id }, 'Message sent successfully');

      return {
        success: true,
        messageId: result.message_id,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to send Telegram message');
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async sendJobNotification(job: JobNotificationData): Promise<MessageResult> {
    const text = formatJobNotification(job);
    const keyboard = createJobKeyboard(job);

    return this.sendMessage(text, {
      parseMode: 'HTML',
      replyMarkup: keyboard,
    });
  }

  async sendBatchNotifications(jobs: JobNotificationData[]): Promise<{
    sent: number;
    failed: number;
    results: MessageResult[];
  }> {
    let sent = 0;
    let failed = 0;
    const results: MessageResult[] = [];

    for (const job of jobs) {
      const result = await this.sendJobNotification(job);
      results.push(result);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info({ sent, failed, total: jobs.length }, 'Batch notifications completed');

    return { sent, failed, results };
  }

  async testConnection(): Promise<boolean> {
    try {
      const me = await this.bot.getMe();
      logger.info({ botUsername: me.username }, 'Telegram bot connected');
      return true;
    } catch (error) {
      logger.error({ error }, 'Telegram connection test failed');
      return false;
    }
  }
}

export function createTelegramNotifier(config: TelegramConfig): TelegramNotifier {
  return new TelegramNotifier(config);
}
