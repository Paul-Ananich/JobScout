import { describe, it, expect } from 'vitest';

import {
  formatJobNotification,
  createJobKeyboard,
  formatDailySummary,
  formatErrorNotification,
} from '../../src/modules/telegram/formatter.js';
import type { JobNotificationData } from '../../src/modules/telegram/types.js';

const createMockJob = (overrides: Partial<JobNotificationData> = {}): JobNotificationData => ({
  jobId: 'job-123',
  title: 'Senior React Developer',
  company: 'TechCorp Inc',
  location: 'Remote - Worldwide',
  url: 'https://linkedin.com/jobs/view/123',
  salary: '$120k - $150k',
  seniorityLevel: 'senior',
  techStack: ['React', 'TypeScript', 'Node.js'],
  remoteType: 'worldwide',
  matchScore: 85,
  matchReasons: ['Senior level match', 'React tech match', 'Worldwide remote'],
  ...overrides,
});

describe('Telegram Formatter', () => {
  describe('formatJobNotification', () => {
    it('should include job title with emoji', () => {
      const job = createMockJob();
      const message = formatJobNotification(job);
      expect(message).toContain('🎯');
      expect(message).toContain('Senior React Developer');
    });

    it('should include company name', () => {
      const job = createMockJob();
      const message = formatJobNotification(job);
      expect(message).toContain('🏢');
      expect(message).toContain('TechCorp Inc');
    });

    it('should include location when provided', () => {
      const job = createMockJob({ location: 'San Francisco, CA' });
      const message = formatJobNotification(job);
      expect(message).toContain('📍');
      expect(message).toContain('San Francisco, CA');
    });

    it('should include salary when provided', () => {
      const job = createMockJob();
      const message = formatJobNotification(job);
      expect(message).toContain('💰');
      expect(message).toContain('$120k - $150k');
    });

    it('should include seniority level', () => {
      const job = createMockJob();
      const message = formatJobNotification(job);
      expect(message).toContain('📊');
      expect(message).toContain('Senior');
    });

    it('should include remote type with emoji', () => {
      const job = createMockJob({ remoteType: 'worldwide' });
      const message = formatJobNotification(job);
      expect(message).toContain('🌍');
      expect(message).toContain('Worldwide');
    });

    it('should include tech stack', () => {
      const job = createMockJob();
      const message = formatJobNotification(job);
      expect(message).toContain('🛠');
      expect(message).toContain('React');
      expect(message).toContain('TypeScript');
    });

    it('should limit tech stack to 8 items', () => {
      const job = createMockJob({
        title: 'Developer',
        techStack: ['Alpha', 'Beta', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet'],
      });
      const message = formatJobNotification(job);
      expect(message).toContain('Hotel');
      expect(message).not.toContain('India');
      expect(message).not.toContain('Juliet');
    });

    it('should include match score with visual bar', () => {
      const job = createMockJob({ matchScore: 80 });
      const message = formatJobNotification(job);
      expect(message).toContain('⭐');
      expect(message).toContain('80%');
      expect(message).toContain('█');
    });

    it('should include match reasons', () => {
      const job = createMockJob();
      const message = formatJobNotification(job);
      expect(message).toContain('✅');
      expect(message).toContain('Senior level match');
    });

    it('should escape HTML entities', () => {
      const job = createMockJob({
        company: 'Tech & Co <Ltd>',
        title: 'Dev "Pro"',
      });
      const message = formatJobNotification(job);
      expect(message).toContain('&amp;');
      expect(message).toContain('&lt;');
      expect(message).toContain('&gt;');
    });

    it('should handle missing optional fields', () => {
      const job: JobNotificationData = {
        jobId: 'job-1',
        title: 'Developer',
        company: 'Company',
        url: 'https://example.com',
        techStack: [],
        matchReasons: [],
      };
      const message = formatJobNotification(job);
      expect(message).toContain('Developer');
      expect(message).toContain('Company');
    });
  });

  describe('createJobKeyboard', () => {
    it('should create keyboard with View Job button', () => {
      const job = createMockJob();
      const keyboard = createJobKeyboard(job);
      const viewButton = keyboard.inline_keyboard[0]?.find((b) => b.text === '🔗 View Job');
      expect(viewButton).toBeDefined();
      expect(viewButton?.url).toBe(job.url);
    });

    it('should create keyboard with Company button', () => {
      const job = createMockJob();
      const keyboard = createJobKeyboard(job);
      const companyButton = keyboard.inline_keyboard[0]?.find((b) => b.text === '🏢 Company');
      expect(companyButton).toBeDefined();
      expect(companyButton?.url).toContain('linkedin.com/company');
    });

    it('should create keyboard with Interested button', () => {
      const job = createMockJob();
      const keyboard = createJobKeyboard(job);
      const interestedButton = keyboard.inline_keyboard[1]?.find(
        (b) => b.text === '👍 Interested'
      );
      expect(interestedButton).toBeDefined();
      expect(interestedButton?.callback_data).toBe(`interested:${job.jobId}`);
    });

    it('should create keyboard with Reject button', () => {
      const job = createMockJob();
      const keyboard = createJobKeyboard(job);
      const rejectButton = keyboard.inline_keyboard[1]?.find((b) => b.text === '👎 Not for me');
      expect(rejectButton).toBeDefined();
      expect(rejectButton?.callback_data).toBe(`reject:${job.jobId}`);
    });

    it('should create keyboard with Save button', () => {
      const job = createMockJob();
      const keyboard = createJobKeyboard(job);
      const saveButton = keyboard.inline_keyboard[2]?.find(
        (b) => b.text === '📋 Save for later'
      );
      expect(saveButton).toBeDefined();
      expect(saveButton?.callback_data).toBe(`save:${job.jobId}`);
    });

    it('should have 3 rows of buttons', () => {
      const job = createMockJob();
      const keyboard = createJobKeyboard(job);
      expect(keyboard.inline_keyboard.length).toBe(3);
    });
  });

  describe('formatDailySummary', () => {
    it('should include summary header', () => {
      const summary = formatDailySummary({
        newJobs: 10,
        matchedJobs: 5,
        notifiedJobs: 5,
        topMatches: [],
      });
      expect(summary).toContain('Daily Job Summary');
    });

    it('should include job counts', () => {
      const summary = formatDailySummary({
        newJobs: 100,
        matchedJobs: 25,
        notifiedJobs: 20,
        topMatches: [],
      });
      expect(summary).toContain('100');
      expect(summary).toContain('25');
      expect(summary).toContain('20');
    });

    it('should include top matches', () => {
      const summary = formatDailySummary({
        newJobs: 10,
        matchedJobs: 2,
        notifiedJobs: 2,
        topMatches: [createMockJob({ title: 'Great Job', matchScore: 95 })],
      });
      expect(summary).toContain('Top Matches');
      expect(summary).toContain('Great Job');
      expect(summary).toContain('95%');
    });

    it('should limit top matches to 5', () => {
      const topMatches = Array(10)
        .fill(null)
        .map((_, i) => createMockJob({ title: `Job ${i}`, matchScore: 90 - i }));

      const summary = formatDailySummary({
        newJobs: 10,
        matchedJobs: 10,
        notifiedJobs: 10,
        topMatches,
      });

      expect(summary).toContain('Job 0');
      expect(summary).toContain('Job 4');
      expect(summary).not.toContain('Job 5');
    });
  });

  describe('formatErrorNotification', () => {
    it('should include error type', () => {
      const message = formatErrorNotification({
        type: 'EmailFetchError',
        message: 'Failed to connect',
      });
      expect(message).toContain('EmailFetchError');
    });

    it('should include error message', () => {
      const message = formatErrorNotification({
        type: 'Error',
        message: 'Something went wrong',
      });
      expect(message).toContain('Something went wrong');
    });

    it('should include context when provided', () => {
      const message = formatErrorNotification({
        type: 'Error',
        message: 'Failed',
        context: 'During email processing',
      });
      expect(message).toContain('During email processing');
    });

    it('should truncate long messages', () => {
      const longMessage = 'A'.repeat(300);
      const message = formatErrorNotification({
        type: 'Error',
        message: longMessage,
      });
      expect(message.length).toBeLessThan(400);
    });
  });
});
