import { describe, it, expect } from 'vitest';

import { parseLinkedInEmail, isLinkedInJobAlertEmail } from '../../src/modules/parser/linkedin.js';
import type { EmailContent } from '../../src/modules/email/types.js';
import {
  cleanText,
  extractUrls,
  isLinkedInJobUrl,
  normalizeLinkedInUrl,
  decodeHtmlEntities,
} from '../../src/modules/parser/utils.js';

const createMockEmail = (overrides: Partial<EmailContent> = {}): EmailContent => ({
  messageId: 'test-123',
  threadId: 'thread-456',
  subject: 'Jobs for you: Senior React Developer and more',
  from: 'jobs-noreply@linkedin.com',
  to: 'user@example.com',
  date: new Date(),
  textBody: '',
  htmlBody: '',
  raw: '',
  ...overrides,
});

describe('LinkedIn Email Parser', () => {
  describe('parseLinkedInEmail', () => {
    it('should parse job alert email with single job', () => {
      const email = createMockEmail({
        htmlBody: `
          <table>
            <tr>
              <td>
                <a href="https://www.linkedin.com/jobs/view/123456789">Senior React Developer</a>
                at TechCorp
                <br/>Location: Remote
              </td>
            </tr>
          </table>
        `,
      });

      const result = parseLinkedInEmail(email);

      expect(result.success).toBe(true);
      expect(result.jobs.length).toBeGreaterThanOrEqual(1);
      expect(result.jobs[0]?.title).toBe('Senior React Developer');
    });

    it('should parse multiple jobs from email', () => {
      const email = createMockEmail({
        htmlBody: `
          <table>
            <tr>
              <td>
                <a href="https://www.linkedin.com/jobs/view/111">React Developer</a>
                at Company A
              </td>
            </tr>
            <tr>
              <td>
                <a href="https://www.linkedin.com/jobs/view/222">Frontend Engineer</a>
                at Company B
              </td>
            </tr>
            <tr>
              <td>
                <a href="https://www.linkedin.com/jobs/view/333">Software Engineer</a>
                at Company C
              </td>
            </tr>
          </table>
        `,
      });

      const result = parseLinkedInEmail(email);

      expect(result.success).toBe(true);
      expect(result.jobs.length).toBe(3);
    });

    it('should extract LinkedIn job IDs correctly', () => {
      const email = createMockEmail({
        htmlBody: `
          <a href="https://www.linkedin.com/jobs/view/123456789?refId=abc">Job Title</a>
        `,
      });

      const result = parseLinkedInEmail(email);

      expect(result.jobs[0]?.externalId).toBe('123456789');
    });

    it('should handle email with no jobs', () => {
      const email = createMockEmail({
        htmlBody: '<p>No jobs available this week</p>',
      });

      const result = parseLinkedInEmail(email);

      expect(result.success).toBe(true);
      expect(result.jobs.length).toBe(0);
    });

    it('should handle empty email body', () => {
      const email = createMockEmail({
        htmlBody: '',
        textBody: '',
      });

      const result = parseLinkedInEmail(email);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Email has no content');
    });

    it('should parse jobs with location info', () => {
      const email = createMockEmail({
        htmlBody: `
          <tr>
            <a href="https://www.linkedin.com/jobs/view/999">Developer</a>
            <td>Location: San Francisco, CA (Remote)</td>
          </tr>
        `,
      });

      const result = parseLinkedInEmail(email);

      expect(result.jobs.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse time-ago posted dates', () => {
      const email = createMockEmail({
        htmlBody: `
          <tr>
            <a href="https://www.linkedin.com/jobs/view/888">Engineer</a>
            <span>2 days ago</span>
          </tr>
        `,
      });

      const result = parseLinkedInEmail(email);

      expect(result.jobs.length).toBeGreaterThanOrEqual(1);
    });

    it('should normalize LinkedIn URLs', () => {
      const email = createMockEmail({
        htmlBody: `
          <a href="https://www.linkedin.com/jobs/view/777?utm_source=email&refId=123">Job</a>
        `,
      });

      const result = parseLinkedInEmail(email);

      expect(result.jobs[0]?.url).toBe('https://www.linkedin.com/jobs/view/777');
    });

    it('should set source to linkedin', () => {
      const email = createMockEmail({
        htmlBody: `<a href="https://www.linkedin.com/jobs/view/555">Job</a>`,
      });

      const result = parseLinkedInEmail(email);

      expect(result.jobs[0]?.source).toBe('linkedin');
    });
  });

  describe('isLinkedInJobAlertEmail', () => {
    it('should identify LinkedIn job alert emails', () => {
      const email = createMockEmail({
        from: 'jobs-noreply@linkedin.com',
        subject: 'Your job alert: Senior Developer',
      });

      expect(isLinkedInJobAlertEmail(email)).toBe(true);
    });

    it('should reject non-LinkedIn emails', () => {
      const email = createMockEmail({
        from: 'newsletter@example.com',
        subject: 'Weekly Newsletter',
      });

      expect(isLinkedInJobAlertEmail(email)).toBe(false);
    });

    it('should identify emails with "career" in subject', () => {
      const email = createMockEmail({
        from: 'notifications@linkedin.com',
        subject: 'Career opportunities for you',
      });

      expect(isLinkedInJobAlertEmail(email)).toBe(true);
    });

    it('should reject LinkedIn emails without job keywords', () => {
      const email = createMockEmail({
        from: 'messages@linkedin.com',
        subject: 'You have a new message',
      });

      expect(isLinkedInJobAlertEmail(email)).toBe(false);
    });
  });
});

describe('Parser Utils', () => {
  describe('cleanText', () => {
    it('should collapse multiple spaces', () => {
      expect(cleanText('hello    world')).toBe('hello world');
    });

    it('should trim whitespace', () => {
      expect(cleanText('  hello  ')).toBe('hello');
    });

    it('should collapse multiple newlines into single newline', () => {
      const result = cleanText('hello\n\n\nworld');
      expect(result).not.toContain('\n\n');
    });
  });

  describe('extractUrls', () => {
    it('should extract HTTP URLs', () => {
      const text = 'Visit http://example.com for more';
      const urls = extractUrls(text);
      expect(urls).toContain('http://example.com');
    });

    it('should extract HTTPS URLs', () => {
      const text = 'Visit https://example.com/page for more';
      const urls = extractUrls(text);
      expect(urls).toContain('https://example.com/page');
    });

    it('should extract multiple URLs', () => {
      const text = 'Check http://a.com and https://b.com';
      const urls = extractUrls(text);
      expect(urls.length).toBe(2);
    });

    it('should deduplicate URLs', () => {
      const text = 'Check http://a.com and http://a.com again';
      const urls = extractUrls(text);
      expect(urls.length).toBe(1);
    });
  });

  describe('isLinkedInJobUrl', () => {
    it('should match linkedin.com/jobs URLs', () => {
      expect(isLinkedInJobUrl('https://www.linkedin.com/jobs/view/123')).toBe(true);
    });

    it('should match linkedin.com/comm/jobs URLs', () => {
      expect(isLinkedInJobUrl('https://www.linkedin.com/comm/jobs/view/123')).toBe(true);
    });

    it('should reject non-job LinkedIn URLs', () => {
      expect(isLinkedInJobUrl('https://www.linkedin.com/in/profile')).toBe(false);
    });

    it('should reject non-LinkedIn URLs', () => {
      expect(isLinkedInJobUrl('https://indeed.com/jobs/123')).toBe(false);
    });
  });

  describe('normalizeLinkedInUrl', () => {
    it('should extract job ID and create canonical URL', () => {
      const url = 'https://www.linkedin.com/jobs/view/123456?refId=abc&utm_source=email';
      expect(normalizeLinkedInUrl(url)).toBe('https://www.linkedin.com/jobs/view/123456');
    });

    it('should handle currentJobId parameter', () => {
      const url = 'https://www.linkedin.com/jobs/search?currentJobId=789';
      expect(normalizeLinkedInUrl(url)).toBe('https://www.linkedin.com/jobs/view/789');
    });

    it('should return original URL if no job ID found', () => {
      const url = 'https://www.linkedin.com/jobs/search';
      expect(normalizeLinkedInUrl(url)).toBe(url);
    });
  });

  describe('decodeHtmlEntities', () => {
    it('should decode &amp;', () => {
      expect(decodeHtmlEntities('Tom &amp; Jerry')).toBe('Tom & Jerry');
    });

    it('should decode &lt; and &gt;', () => {
      expect(decodeHtmlEntities('&lt;div&gt;')).toBe('<div>');
    });

    it('should decode numeric entities', () => {
      expect(decodeHtmlEntities('&#39;hello&#39;')).toBe("'hello'");
    });

    it('should decode hex entities', () => {
      expect(decodeHtmlEntities('&#x27;test&#x27;')).toBe("'test'");
    });

    it('should handle multiple entities', () => {
      expect(decodeHtmlEntities('&lt;b&gt;Bold &amp; Italic&lt;/b&gt;')).toBe(
        '<b>Bold & Italic</b>'
      );
    });
  });
});
