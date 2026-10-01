import { google, gmail_v1 } from 'googleapis';

import { EmailFetchError } from '../../shared/errors.js';
import { createChildLogger } from '../../shared/logger.js';

import type { EmailContent, EmailFetchOptions, GmailMessage } from './types.js';

const logger = createChildLogger('gmail');

export class GmailClient {
  private gmail: gmail_v1.Gmail;

  constructor(credentials: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  }) {
    const oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  }

  async fetchUnreadEmails(options: EmailFetchOptions = {}): Promise<EmailContent[]> {
    const { maxResults = 10, query = '', labelIds = ['INBOX'] } = options;

    try {
      const baseQuery = 'is:unread from:jobs-noreply@linkedin.com';
      const fullQuery = query ? `${baseQuery} ${query}` : baseQuery;

      logger.debug({ query: fullQuery, maxResults }, 'Fetching emails');

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: fullQuery,
        labelIds,
        maxResults,
      });

      const messages = response.data.messages || [];
      logger.info({ count: messages.length }, 'Found unread emails');

      const emails: EmailContent[] = [];

      for (const msg of messages) {
        if (!msg.id) continue;

        try {
          const email = await this.getEmailContent(msg.id);
          if (email) {
            emails.push(email);
          }
        } catch (error) {
          logger.warn({ messageId: msg.id, error }, 'Failed to fetch email content');
        }
      }

      return emails;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch emails');
      throw new EmailFetchError('Failed to fetch emails from Gmail', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getEmailContent(messageId: string): Promise<EmailContent | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const message = response.data as unknown as GmailMessage;
      if (!message.payload) {
        return null;
      }

      const headers = message.payload.headers || [];
      const getHeader = (name: string): string =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      const dateStr = getHeader('Date');

      const { textBody, htmlBody } = this.extractBodies(message.payload);

      return {
        messageId: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date: dateStr ? new Date(dateStr) : new Date(parseInt(message.internalDate)),
        textBody,
        htmlBody,
        raw: JSON.stringify(message.payload),
      };
    } catch (error) {
      logger.error({ messageId, error }, 'Failed to get email content');
      return null;
    }
  }

  private extractBodies(payload: GmailMessage['payload']): { textBody: string; htmlBody: string } {
    let textBody = '';
    let htmlBody = '';

    const extractFromPart = (part: GmailMessage['payload']) => {
      if (part.body?.data) {
        const decoded = Buffer.from(part.body.data, 'base64').toString('utf-8');
        if (part.mimeType === 'text/plain') {
          textBody = decoded;
        } else if (part.mimeType === 'text/html') {
          htmlBody = decoded;
        }
      }

      if (part.parts) {
        for (const subPart of part.parts) {
          extractFromPart(subPart as GmailMessage['payload']);
        }
      }
    };

    extractFromPart(payload);

    return { textBody, htmlBody };
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
      logger.debug({ messageId }, 'Marked email as read');
    } catch (error) {
      logger.warn({ messageId, error }, 'Failed to mark email as read');
    }
  }

  async addLabel(messageId: string, labelId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId],
        },
      });
      logger.debug({ messageId, labelId }, 'Added label to email');
    } catch (error) {
      logger.warn({ messageId, labelId, error }, 'Failed to add label');
    }
  }
}

export function createGmailClient(config: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): GmailClient {
  return new GmailClient(config);
}
