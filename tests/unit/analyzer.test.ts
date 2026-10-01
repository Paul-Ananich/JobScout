import { describe, it, expect } from 'vitest';

import {
  validateAnalysis,
  parseJsonFromLlm,
  type JobAnalysisOutput,
} from '../../src/modules/analyzer/schema.js';
import { createAnalysisPrompt, ANALYSIS_SYSTEM_PROMPT } from '../../src/modules/analyzer/prompts.js';

describe('Analyzer Schema', () => {
  describe('validateAnalysis', () => {
    it('should validate correct analysis object', () => {
      const input = {
        seniorityLevel: 'senior',
        requiredSkills: ['React', 'TypeScript'],
        techStack: ['Node.js', 'PostgreSQL'],
        remoteType: 'worldwide',
        locationRestrictions: [],
        experienceYears: 5,
      };

      const result = validateAnalysis(input);
      expect(result).not.toBeNull();
      expect(result?.seniorityLevel).toBe('senior');
    });

    it('should validate analysis without optional experienceYears', () => {
      const input = {
        seniorityLevel: 'mid',
        requiredSkills: ['JavaScript'],
        techStack: ['React'],
        remoteType: 'europe',
        locationRestrictions: ['EU countries'],
      };

      const result = validateAnalysis(input);
      expect(result).not.toBeNull();
      expect(result?.experienceYears).toBeUndefined();
    });

    it('should reject invalid seniority level', () => {
      const input = {
        seniorityLevel: 'super-senior',
        requiredSkills: [],
        techStack: [],
        remoteType: 'worldwide',
        locationRestrictions: [],
      };

      const result = validateAnalysis(input);
      expect(result).toBeNull();
    });

    it('should reject invalid remote type', () => {
      const input = {
        seniorityLevel: 'senior',
        requiredSkills: [],
        techStack: [],
        remoteType: 'anywhere',
        locationRestrictions: [],
      };

      const result = validateAnalysis(input);
      expect(result).toBeNull();
    });

    it('should reject experienceYears over 30', () => {
      const input = {
        seniorityLevel: 'senior',
        requiredSkills: [],
        techStack: [],
        remoteType: 'worldwide',
        locationRestrictions: [],
        experienceYears: 50,
      };

      const result = validateAnalysis(input);
      expect(result).toBeNull();
    });

    it('should reject negative experienceYears', () => {
      const input = {
        seniorityLevel: 'junior',
        requiredSkills: [],
        techStack: [],
        remoteType: 'onsite',
        locationRestrictions: [],
        experienceYears: -1,
      };

      const result = validateAnalysis(input);
      expect(result).toBeNull();
    });
  });

  describe('parseJsonFromLlm', () => {
    it('should parse plain JSON', () => {
      const text = '{"key": "value"}';
      const result = parseJsonFromLlm(text);
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse JSON from markdown code block', () => {
      const text = '```json\n{"key": "value"}\n```';
      const result = parseJsonFromLlm(text);
      expect(result).toEqual({ key: 'value' });
    });

    it('should parse JSON from code block without language', () => {
      const text = '```\n{"key": "value"}\n```';
      const result = parseJsonFromLlm(text);
      expect(result).toEqual({ key: 'value' });
    });

    it('should handle JSON with surrounding text', () => {
      const text = 'Here is the analysis: {"key": "value"} That is all.';
      const result = parseJsonFromLlm(text);
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const text = 'This is not JSON at all';
      const result = parseJsonFromLlm(text);
      expect(result).toBeNull();
    });

    it('should parse nested JSON objects', () => {
      const text = '{"analysis": {"seniorityLevel": "senior"}}';
      const result = parseJsonFromLlm(text) as { analysis: { seniorityLevel: string } };
      expect(result?.analysis?.seniorityLevel).toBe('senior');
    });
  });
});

describe('Analyzer Prompts', () => {
  describe('createAnalysisPrompt', () => {
    it('should include job title', () => {
      const prompt = createAnalysisPrompt({
        title: 'Senior Developer',
        company: 'TechCorp',
      });
      expect(prompt).toContain('Senior Developer');
    });

    it('should include company name', () => {
      const prompt = createAnalysisPrompt({
        title: 'Developer',
        company: 'Amazing Company',
      });
      expect(prompt).toContain('Amazing Company');
    });

    it('should include location when provided', () => {
      const prompt = createAnalysisPrompt({
        title: 'Developer',
        company: 'Company',
        location: 'New York, NY',
      });
      expect(prompt).toContain('New York, NY');
    });

    it('should include description when provided', () => {
      const prompt = createAnalysisPrompt({
        title: 'Developer',
        company: 'Company',
        description: 'We are looking for a talented developer...',
      });
      expect(prompt).toContain('We are looking for a talented developer');
    });

    it('should not include location label when not provided', () => {
      const prompt = createAnalysisPrompt({
        title: 'Developer',
        company: 'Company',
      });
      expect(prompt).not.toContain('Location:');
    });
  });

  describe('ANALYSIS_SYSTEM_PROMPT', () => {
    it('should include seniority guidelines', () => {
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('intern');
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('junior');
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('senior');
    });

    it('should include remote type guidelines', () => {
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('worldwide');
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('europe');
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('eu-only');
    });

    it('should mention that Remote alone does not mean worldwide', () => {
      expect(ANALYSIS_SYSTEM_PROMPT).toContain('Remote');
      expect(ANALYSIS_SYSTEM_PROMPT.toLowerCase()).toContain('not mean worldwide');
    });
  });
});
