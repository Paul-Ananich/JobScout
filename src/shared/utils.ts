import { createHash } from 'crypto';

export function hashUrl(url: string): string {
  const normalized = normalizeUrl(url);
  return createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'refId', 'trackingId'];
    paramsToRemove.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString().toLowerCase().replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
}

export function extractLinkedInJobId(url: string): string | undefined {
  const patterns = [
    /linkedin\.com\/(?:comm\/)?jobs\/view\/(\d+)/i,
    /linkedin\.com\/jobs\/(\d+)/i,
    /currentJobId=(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: { maxRetries: number; baseDelayMs: number; maxDelayMs: number }
): Promise<T> {
  let lastError: Error = new Error('Retry failed');
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < options.maxRetries) {
        const delay = Math.min(options.baseDelayMs * Math.pow(2, attempt), options.maxDelayMs);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;

  const now = new Date();
  const lowerStr = dateStr.toLowerCase().trim();

  if (lowerStr.includes('just now') || lowerStr.includes('moment')) {
    return now;
  }

  const relativeMatch = lowerStr.match(/(\d+)\s*(minute|hour|day|week|month)s?\s*ago/i);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1] ?? '0', 10);
    const unit = relativeMatch[2]?.toLowerCase();
    const date = new Date(now);

    switch (unit) {
      case 'minute':
        date.setMinutes(date.getMinutes() - amount);
        break;
      case 'hour':
        date.setHours(date.getHours() - amount);
        break;
      case 'day':
        date.setDate(date.getDate() - amount);
        break;
      case 'week':
        date.setDate(date.getDate() - amount * 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() - amount);
        break;
    }
    return date;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return undefined;
}
