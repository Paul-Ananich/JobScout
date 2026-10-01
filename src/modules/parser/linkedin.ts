import type { EmailContent } from '../email/types.js';

import { createChildLogger } from '../../shared/logger.js';
import type { RawJobData } from '../../shared/types.js';
import { extractLinkedInJobId, parseDate } from '../../shared/utils.js';

import type { ParseResult, LinkedInJobEntry } from './types.js';
import {
  cleanText,
  decodeHtmlEntities,
  isLinkedInJobUrl,
  normalizeLinkedInUrl,
  stripHtmlTags,
} from './utils.js';

const logger = createChildLogger('parser:linkedin');

const SOURCE = 'linkedin';

export function parseLinkedInEmail(email: EmailContent): ParseResult {
  const startTime = Date.now();
  const errors: string[] = [];
  const jobs: RawJobData[] = [];

  try {
    const html = email.htmlBody || email.textBody;
    if (!html) {
      return {
        success: false,
        jobs: [],
        errors: ['Email has no content'],
        metadata: {
          emailSubject: email.subject,
          emailFrom: email.from,
          jobCount: 0,
          parseTime: Date.now() - startTime,
        },
      };
    }

    const entries = extractJobEntries(html);
    logger.debug({ count: entries.length }, 'Extracted job entries from email');

    for (const entry of entries) {
      try {
        const job = convertToRawJobData(entry, email);
        if (job) {
          jobs.push(job);
        }
      } catch (error) {
        const msg = `Failed to convert job entry: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(msg);
        logger.warn({ entry, error }, msg);
      }
    }

    return {
      success: jobs.length > 0 || entries.length === 0,
      jobs,
      errors,
      metadata: {
        emailSubject: email.subject,
        emailFrom: email.from,
        jobCount: jobs.length,
        parseTime: Date.now() - startTime,
      },
    };
  } catch (error) {
    logger.error({ error }, 'Failed to parse LinkedIn email');
    return {
      success: false,
      jobs: [],
      errors: [error instanceof Error ? error.message : String(error)],
      metadata: {
        emailSubject: email.subject,
        emailFrom: email.from,
        jobCount: 0,
        parseTime: Date.now() - startTime,
      },
    };
  }
}

function extractJobEntries(html: string): LinkedInJobEntry[] {
  const entries: LinkedInJobEntry[] = [];
  const seenUrls = new Set<string>();

  const patterns = [
    extractFromJobAlertFormat(html),
    extractFromDigestFormat(html),
    extractFromSimpleFormat(html),
  ];

  for (const patternEntries of patterns) {
    for (const entry of patternEntries) {
      const normalizedUrl = normalizeLinkedInUrl(entry.url);
      if (!seenUrls.has(normalizedUrl) && isLinkedInJobUrl(normalizedUrl)) {
        seenUrls.add(normalizedUrl);
        entries.push({ ...entry, url: normalizedUrl });
      }
    }
  }

  return entries;
}

function extractFromJobAlertFormat(html: string): LinkedInJobEntry[] {
  const entries: LinkedInJobEntry[] = [];

  const jobBlockRegex =
    /<tr[^>]*>[\s\S]*?<a[^>]*href="([^"]*linkedin[^"]*jobs[^"]*)"[^>]*>[\s\S]*?<\/tr>/gi;
  let match;

  while ((match = jobBlockRegex.exec(html)) !== null) {
    const block = match[0];
    const url = decodeHtmlEntities(match[1] ?? '');

    if (!isLinkedInJobUrl(url)) continue;

    const titleMatch = block.match(
      /<a[^>]*href="[^"]*jobs[^"]*"[^>]*>(?:<[^>]+>)*([^<]+)/i
    );
    const title = titleMatch ? cleanText(decodeHtmlEntities(titleMatch[1] ?? '')) : '';

    const companyMatch = block.match(
      /(?:at\s+|company[^>]*>)(?:<[^>]+>)*([^<]+)|<td[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>[\s\S]*?<\/td>/i
    );
    const company = companyMatch
      ? cleanText(decodeHtmlEntities(companyMatch[1] ?? companyMatch[2] ?? ''))
      : '';

    const locationMatch = block.match(
      /(?:location|📍|in\s+)(?:[^>]*>)*([^<,]+(?:,\s*[^<]+)?)|<td[^>]*>[^<]*(?:Remote|Hybrid|On-?site)[^<]*<\/td>/i
    );
    const location = locationMatch
      ? cleanText(decodeHtmlEntities(locationMatch[1] ?? locationMatch[0] ?? ''))
      : undefined;

    const timeMatch = block.match(/(\d+\s*(?:hour|day|week|month)s?\s*ago|just\s*now)/i);
    const postedTime = timeMatch ? timeMatch[1] : undefined;

    if (title && url) {
      entries.push({ title, company, location, url, postedTime });
    }
  }

  return entries;
}

function extractFromDigestFormat(html: string): LinkedInJobEntry[] {
  const entries: LinkedInJobEntry[] = [];

  const linkRegex = /<a[^>]*href="([^"]*linkedin\.com[^"]*job[^"]*)"[^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = decodeHtmlEntities(match[1] ?? '');
    const title = cleanText(decodeHtmlEntities(match[2] ?? ''));

    if (!isLinkedInJobUrl(url) || !title) continue;
    if (title.toLowerCase().includes('view') && title.length < 20) continue;

    const contextStart = Math.max(0, (match.index ?? 0) - 500);
    const contextEnd = Math.min(html.length, (match.index ?? 0) + (match[0]?.length ?? 0) + 500);
    const context = html.slice(contextStart, contextEnd);

    const companyPattern = /(?:at|@)\s+([A-Z][A-Za-z0-9\s&.,'-]+?)(?:\s*[-·|]|\s*<)/;
    const companyMatch = context.match(companyPattern);
    const company = companyMatch ? cleanText(decodeHtmlEntities(companyMatch[1] ?? '')) : '';

    entries.push({ title, company, url, location: undefined, postedTime: undefined });
  }

  return entries;
}

function extractFromSimpleFormat(html: string): LinkedInJobEntry[] {
  const entries: LinkedInJobEntry[] = [];
  const text = stripHtmlTags(html);

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const urlMatch = line.match(/(https?:\/\/[^\s]*linkedin[^\s]*job[^\s]*)/i);

    if (urlMatch && isLinkedInJobUrl(urlMatch[1] ?? '')) {
      const url = normalizeLinkedInUrl(urlMatch[1] ?? '');

      let title = '';
      let company = '';

      for (let j = Math.max(0, i - 3); j < i; j++) {
        const prevLine = lines[j] ?? '';
        if (prevLine.length > 10 && prevLine.length < 100 && !prevLine.includes('http')) {
          if (!title) {
            title = prevLine;
          } else if (!company) {
            company = prevLine;
          }
        }
      }

      if (title) {
        entries.push({ title, company, url, location: undefined, postedTime: undefined });
      }
    }
  }

  return entries;
}

function convertToRawJobData(entry: LinkedInJobEntry, email: EmailContent): RawJobData | null {
  if (!entry.url || !entry.title) {
    return null;
  }

  const externalId = extractLinkedInJobId(entry.url);
  const postedAt = entry.postedTime ? parseDate(entry.postedTime) : undefined;

  return {
    source: SOURCE,
    externalId,
    url: entry.url,
    title: entry.title,
    company: entry.company || 'Unknown',
    location: entry.location,
    description: undefined,
    salary: undefined,
    postedAt,
    rawContent: email.htmlBody || email.textBody,
  };
}

export function isLinkedInJobAlertEmail(email: EmailContent): boolean {
  const from = email.from.toLowerCase();
  const subject = email.subject.toLowerCase();

  if (!from.includes('linkedin')) {
    return false;
  }

  const jobKeywords = ['job', 'career', 'opportunity', 'position', 'role', 'hiring'];
  return jobKeywords.some((keyword) => subject.includes(keyword));
}
