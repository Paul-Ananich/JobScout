import { describe, it, expect } from 'vitest';

import { hashUrl, normalizeUrl, extractLinkedInJobId } from '../../src/shared/utils.js';

describe('Deduplication', () => {
  describe('hashUrl', () => {
    it('should produce consistent hash for same URL', () => {
      const url = 'https://linkedin.com/jobs/view/123';
      const hash1 = hashUrl(url);
      const hash2 = hashUrl(url);
      expect(hash1).toBe(hash2);
    });

    it('should produce same hash for URLs differing only in case', () => {
      const hash1 = hashUrl('https://LinkedIn.com/jobs/view/123');
      const hash2 = hashUrl('https://linkedin.com/jobs/view/123');
      expect(hash1).toBe(hash2);
    });

    it('should produce same hash for URLs with/without trailing slash', () => {
      const hash1 = hashUrl('https://linkedin.com/jobs/view/123/');
      const hash2 = hashUrl('https://linkedin.com/jobs/view/123');
      expect(hash1).toBe(hash2);
    });

    it('should produce same hash ignoring utm parameters', () => {
      const hash1 = hashUrl('https://linkedin.com/jobs/view/123?utm_source=email');
      const hash2 = hashUrl('https://linkedin.com/jobs/view/123');
      expect(hash1).toBe(hash2);
    });

    it('should produce same hash ignoring tracking parameters', () => {
      const hash1 = hashUrl('https://linkedin.com/jobs/view/123?refId=abc&trackingId=xyz');
      const hash2 = hashUrl('https://linkedin.com/jobs/view/123');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different job IDs', () => {
      const hash1 = hashUrl('https://linkedin.com/jobs/view/123');
      const hash2 = hashUrl('https://linkedin.com/jobs/view/456');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle malformed URLs', () => {
      const hash = hashUrl('not-a-url');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('normalizeUrl', () => {
    it('should lowercase URL', () => {
      const normalized = normalizeUrl('HTTPS://LINKEDIN.COM/JOBS/VIEW/123');
      expect(normalized).toBe('https://linkedin.com/jobs/view/123');
    });

    it('should remove trailing slash', () => {
      const normalized = normalizeUrl('https://linkedin.com/jobs/view/123/');
      expect(normalized).toBe('https://linkedin.com/jobs/view/123');
    });

    it('should remove hash fragment', () => {
      const normalized = normalizeUrl('https://linkedin.com/jobs/view/123#section');
      expect(normalized).toBe('https://linkedin.com/jobs/view/123');
    });

    it('should remove utm parameters', () => {
      const normalized = normalizeUrl(
        'https://linkedin.com/jobs/view/123?utm_source=email&utm_medium=social'
      );
      expect(normalized).not.toContain('utm_source');
      expect(normalized).not.toContain('utm_medium');
    });

    it('should keep other query parameters', () => {
      const normalized = normalizeUrl(
        'https://linkedin.com/jobs/view/123?important=yes'
      );
      expect(normalized).toContain('important=yes');
    });

    it('should handle URL without protocol', () => {
      const normalized = normalizeUrl('linkedin.com/jobs/view/123');
      expect(normalized).toBe('linkedin.com/jobs/view/123');
    });
  });

  describe('extractLinkedInJobId', () => {
    it('should extract job ID from standard URL', () => {
      const id = extractLinkedInJobId('https://www.linkedin.com/jobs/view/3456789012');
      expect(id).toBe('3456789012');
    });

    it('should extract job ID from URL with query params', () => {
      const id = extractLinkedInJobId(
        'https://www.linkedin.com/jobs/view/3456789012?refId=abc'
      );
      expect(id).toBe('3456789012');
    });

    it('should extract job ID from currentJobId parameter', () => {
      const id = extractLinkedInJobId(
        'https://www.linkedin.com/jobs/search/?currentJobId=9876543210'
      );
      expect(id).toBe('9876543210');
    });

    it('should extract job ID from comm/jobs URL', () => {
      const id = extractLinkedInJobId('https://www.linkedin.com/comm/jobs/view/1234567890');
      expect(id).toBe('1234567890');
    });

    it('should return undefined for non-job URLs', () => {
      const id = extractLinkedInJobId('https://www.linkedin.com/in/profile');
      expect(id).toBeUndefined();
    });

    it('should return undefined for non-LinkedIn URLs', () => {
      const id = extractLinkedInJobId('https://indeed.com/jobs/123');
      expect(id).toBeUndefined();
    });

    it('should handle mobile URLs', () => {
      const id = extractLinkedInJobId('https://m.linkedin.com/jobs/view/555444333');
      expect(id).toBe('555444333');
    });
  });
});
