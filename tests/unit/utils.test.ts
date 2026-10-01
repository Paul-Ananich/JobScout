import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  sleep,
  retry,
  truncate,
  escapeHtml,
  stripHtml,
  parseDate,
} from '../../src/shared/utils.js';

describe('Utils', () => {
  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const promise = sleep(1000);
      vi.advanceTimersByTime(1000);
      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('retry', () => {
    it('should return result on first success', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await retry(fn, { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 1000 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail1'))
        .mockRejectedValueOnce(new Error('fail2'))
        .mockResolvedValue('success');

      const result = await retry(fn, { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 10 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('always fails'));

      await expect(
        retry(fn, { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10 })
      ).rejects.toThrow('always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should truncate long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('should handle exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('should handle empty string', () => {
      expect(truncate('', 5)).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than', () => {
      expect(escapeHtml('a < b')).toBe('a &lt; b');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('should escape quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
    });

    it('should escape multiple entities', () => {
      expect(escapeHtml('<div class="test">')).toBe('&lt;div class=&quot;test&quot;&gt;');
    });
  });

  describe('stripHtml', () => {
    it('should remove HTML tags', () => {
      expect(stripHtml('<p>Hello</p>')).toBe('Hello');
    });

    it('should remove nested tags', () => {
      expect(stripHtml('<div><p>Hello <b>World</b></p></div>')).toBe('Hello World');
    });

    it('should remove style tags and content', () => {
      expect(stripHtml('<style>body { color: red; }</style>Hello')).toBe('Hello');
    });

    it('should remove script tags and content', () => {
      expect(stripHtml('<script>alert("hi")</script>Hello')).toBe('Hello');
    });

    it('should collapse whitespace', () => {
      expect(stripHtml('<p>Hello</p>   <p>World</p>')).toBe('Hello World');
    });
  });

  describe('parseDate', () => {
    it('should parse "just now"', () => {
      const result = parseDate('just now');
      expect(result).toBeDefined();
      const diff = Date.now() - result!.getTime();
      expect(diff).toBeLessThan(5000);
    });

    it('should parse "X minutes ago"', () => {
      const result = parseDate('30 minutes ago');
      expect(result).toBeDefined();
      const diffMinutes = (Date.now() - result!.getTime()) / 60000;
      expect(Math.round(diffMinutes)).toBe(30);
    });

    it('should parse "X hours ago"', () => {
      const result = parseDate('2 hours ago');
      expect(result).toBeDefined();
      const diffHours = (Date.now() - result!.getTime()) / 3600000;
      expect(Math.round(diffHours)).toBe(2);
    });

    it('should parse "X days ago"', () => {
      const result = parseDate('5 days ago');
      expect(result).toBeDefined();
      const diffDays = (Date.now() - result!.getTime()) / 86400000;
      expect(Math.round(diffDays)).toBe(5);
    });

    it('should parse "X weeks ago"', () => {
      const result = parseDate('2 weeks ago');
      expect(result).toBeDefined();
      const diffDays = (Date.now() - result!.getTime()) / 86400000;
      expect(Math.round(diffDays)).toBe(14);
    });

    it('should parse ISO date strings', () => {
      const result = parseDate('2024-01-15T10:30:00Z');
      expect(result).toBeDefined();
      expect(result!.getFullYear()).toBe(2024);
    });

    it('should return undefined for invalid dates', () => {
      const result = parseDate('not a date');
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const result = parseDate('');
      expect(result).toBeUndefined();
    });
  });
});
