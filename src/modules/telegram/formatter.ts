import { escapeHtml, truncate } from '../../shared/utils.js';

import type { JobNotificationData, InlineKeyboardMarkup } from './types.js';

export function formatJobNotification(job: JobNotificationData): string {
  const lines: string[] = [];

  lines.push(`🎯 <b>${escapeHtml(job.title)}</b>`);
  lines.push(`🏢 ${escapeHtml(job.company)}`);

  if (job.location) {
    lines.push(`📍 ${escapeHtml(job.location)}`);
  }

  if (job.salary) {
    lines.push(`💰 ${escapeHtml(job.salary)}`);
  }

  lines.push('');

  if (job.seniorityLevel) {
    lines.push(`📊 Level: ${escapeHtml(capitalizeFirst(job.seniorityLevel))}`);
  }

  if (job.remoteType) {
    const remoteEmoji = getRemoteEmoji(job.remoteType);
    lines.push(`${remoteEmoji} Remote: ${escapeHtml(formatRemoteType(job.remoteType))}`);
  }

  if (job.techStack.length > 0) {
    const techList = job.techStack.slice(0, 8).map(escapeHtml).join(', ');
    lines.push(`🛠 Tech: ${techList}`);
  }

  if (job.matchScore !== undefined) {
    const scoreBar = getScoreBar(job.matchScore);
    lines.push(`\n⭐ Match: ${scoreBar} ${job.matchScore}%`);
  }

  if (job.matchReasons.length > 0) {
    lines.push('');
    lines.push('✅ ' + job.matchReasons.slice(0, 3).map(escapeHtml).join('\n✅ '));
  }

  return lines.join('\n');
}

export function createJobKeyboard(job: JobNotificationData): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: '🔗 View Job', url: job.url },
        { text: '🏢 Company', url: getCompanySearchUrl(job.company) },
      ],
      [
        { text: '👍 Interested', callback_data: `interested:${job.jobId}` },
        { text: '👎 Not for me', callback_data: `reject:${job.jobId}` },
      ],
      [{ text: '📋 Save for later', callback_data: `save:${job.jobId}` }],
    ],
  };
}

export function formatDailySummary(stats: {
  newJobs: number;
  matchedJobs: number;
  notifiedJobs: number;
  topMatches: JobNotificationData[];
}): string {
  const lines: string[] = [];

  lines.push('📊 <b>Daily Job Summary</b>');
  lines.push('');
  lines.push(`📥 New jobs processed: ${stats.newJobs}`);
  lines.push(`✅ Matches found: ${stats.matchedJobs}`);
  lines.push(`📨 Notifications sent: ${stats.notifiedJobs}`);

  if (stats.topMatches.length > 0) {
    lines.push('');
    lines.push('<b>🏆 Top Matches:</b>');

    for (const job of stats.topMatches.slice(0, 5)) {
      const score = job.matchScore ?? 0;
      lines.push(`• ${escapeHtml(truncate(job.title, 40))} @ ${escapeHtml(job.company)} (${score}%)`);
    }
  }

  return lines.join('\n');
}

export function formatErrorNotification(error: {
  type: string;
  message: string;
  context?: string;
}): string {
  const lines: string[] = [];

  lines.push('⚠️ <b>JobScout Error</b>');
  lines.push('');
  lines.push(`Type: ${escapeHtml(error.type)}`);
  lines.push(`Message: ${escapeHtml(truncate(error.message, 200))}`);

  if (error.context) {
    lines.push(`Context: ${escapeHtml(truncate(error.context, 100))}`);
  }

  return lines.join('\n');
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatRemoteType(type: string): string {
  const mapping: Record<string, string> = {
    worldwide: 'Worldwide',
    europe: 'Europe',
    'eu-only': 'EU Only',
    emea: 'EMEA',
    'us-only': 'US Only',
    'country-specific': 'Country Specific',
    hybrid: 'Hybrid',
    onsite: 'On-site',
    unknown: 'Unknown',
  };
  return mapping[type] || capitalizeFirst(type);
}

function getRemoteEmoji(type: string): string {
  const mapping: Record<string, string> = {
    worldwide: '🌍',
    europe: '🇪🇺',
    'eu-only': '🇪🇺',
    emea: '🌍',
    'us-only': '🇺🇸',
    'country-specific': '📍',
    hybrid: '🏢',
    onsite: '🏢',
    unknown: '❓',
  };
  return mapping[type] || '🌐';
}

function getScoreBar(score: number): string {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function getCompanySearchUrl(company: string): string {
  const encoded = encodeURIComponent(company);
  return `https://www.linkedin.com/company/${encoded.toLowerCase().replace(/\s+/g, '-')}`;
}
