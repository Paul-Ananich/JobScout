import { describe, it, expect } from 'vitest';

import { JobMatcher, matchJob } from '../../src/modules/filters/matcher.js';
import { createFilterConfig, DEFAULT_FILTER_CONFIG } from '../../src/modules/filters/config.js';
import type { JobMatchInput } from '../../src/modules/filters/types.js';

const createJobInput = (overrides: Partial<JobMatchInput> = {}): JobMatchInput => ({
  title: 'Senior React Developer',
  company: 'TechCorp',
  seniorityLevel: 'senior',
  techStack: ['React', 'TypeScript', 'Node.js'],
  requiredSkills: ['React', 'JavaScript', 'CSS'],
  remoteType: 'worldwide',
  locationRestrictions: [],
  ...overrides,
});

describe('Job Matcher', () => {
  describe('seniority matching', () => {
    it('should match senior level roles', () => {
      const job = createJobInput({ seniorityLevel: 'senior' });
      const result = matchJob(job);
      expect(result.criteria.seniorityMatch).toBe(true);
    });

    it('should match lead level roles', () => {
      const job = createJobInput({ seniorityLevel: 'lead' });
      const result = matchJob(job);
      expect(result.criteria.seniorityMatch).toBe(true);
    });

    it('should match staff level roles', () => {
      const job = createJobInput({ seniorityLevel: 'staff' });
      const result = matchJob(job);
      expect(result.criteria.seniorityMatch).toBe(true);
    });

    it('should not match junior level roles by default', () => {
      const job = createJobInput({ seniorityLevel: 'junior' });
      const result = matchJob(job);
      expect(result.criteria.seniorityMatch).toBe(false);
    });

    it('should not match intern roles by default', () => {
      const job = createJobInput({ seniorityLevel: 'intern' });
      const result = matchJob(job);
      expect(result.criteria.seniorityMatch).toBe(false);
    });
  });

  describe('tech stack matching', () => {
    it('should match React in tech stack', () => {
      const job = createJobInput({ techStack: ['React'] });
      const result = matchJob(job);
      expect(result.criteria.techMatch).toBe(true);
    });

    it('should match React Native in tech stack', () => {
      const job = createJobInput({ techStack: ['React Native', 'Expo'] });
      const result = matchJob(job);
      expect(result.criteria.techMatch).toBe(true);
    });

    it('should match TypeScript', () => {
      const job = createJobInput({ techStack: ['TypeScript', 'Angular'] });
      const result = matchJob(job);
      expect(result.criteria.techMatch).toBe(true);
    });

    it('should match Node.js', () => {
      const job = createJobInput({ techStack: ['Node.js', 'Express'] });
      const result = matchJob(job);
      expect(result.criteria.techMatch).toBe(true);
    });

    it('should not match unrelated tech stacks', () => {
      const job: JobMatchInput = {
        title: 'Backend Developer',
        company: 'Company',
        seniorityLevel: 'senior',
        techStack: ['Python', 'Django', 'FastAPI'],
        requiredSkills: ['PostgreSQL', 'Kubernetes'],
        remoteType: 'worldwide',
        locationRestrictions: [],
      };
      const result = matchJob(job);
      expect(result.criteria.techMatch).toBe(false);
    });

    it('should match skills in requiredSkills field', () => {
      const job = createJobInput({
        techStack: [],
        requiredSkills: ['React', 'Redux'],
      });
      const result = matchJob(job);
      expect(result.criteria.techMatch).toBe(true);
    });
  });

  describe('role matching', () => {
    it('should match Frontend Developer title', () => {
      const job = createJobInput({ title: 'Frontend Developer' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(true);
    });

    it('should match Front-End Engineer title', () => {
      const job = createJobInput({ title: 'Front-End Engineer' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(true);
    });

    it('should match React Developer title', () => {
      const job = createJobInput({ title: 'React Developer' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(true);
    });

    it('should match React Native Developer title', () => {
      const job = createJobInput({ title: 'React Native Developer' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(true);
    });

    it('should match Mobile Developer title', () => {
      const job = createJobInput({ title: 'Mobile Developer' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(true);
    });

    it('should match Full Stack Developer title', () => {
      const job = createJobInput({ title: 'Full Stack Developer' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(true);
    });

    it('should match Software Engineer title', () => {
      const job = createJobInput({ title: 'Software Engineer' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(true);
    });

    it('should not match Backend Developer without frontend keywords', () => {
      const job = createJobInput({ title: 'Backend Developer' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(false);
    });

    it('should not match Data Scientist title', () => {
      const job = createJobInput({ title: 'Data Scientist' });
      const result = matchJob(job);
      expect(result.criteria.roleMatch).toBe(false);
    });
  });

  describe('location matching', () => {
    it('should match worldwide remote', () => {
      const job = createJobInput({ remoteType: 'worldwide' });
      const result = matchJob(job);
      expect(result.criteria.locationMatch).toBe(true);
    });

    it('should match Europe remote for Georgia user', () => {
      const job = createJobInput({ remoteType: 'europe' });
      const result = matchJob(job);
      expect(result.criteria.locationMatch).toBe(true);
    });

    it('should match EMEA remote for Georgia user', () => {
      const job = createJobInput({ remoteType: 'emea' });
      const result = matchJob(job);
      expect(result.criteria.locationMatch).toBe(true);
    });

    it('should not match US-only remote', () => {
      const job = createJobInput({ remoteType: 'us-only' });
      const result = matchJob(job);
      expect(result.criteria.locationMatch).toBe(false);
    });

    it('should not match EU-only remote for Georgia', () => {
      const job = createJobInput({ remoteType: 'eu-only' });
      const result = matchJob(job);
      expect(result.criteria.locationMatch).toBe(false);
    });

    it('should not match onsite positions', () => {
      const job = createJobInput({ remoteType: 'onsite' });
      const result = matchJob(job);
      expect(result.criteria.locationMatch).toBe(false);
    });

    it('should not match hybrid positions', () => {
      const job = createJobInput({ remoteType: 'hybrid' });
      const result = matchJob(job);
      expect(result.criteria.locationMatch).toBe(false);
    });
  });

  describe('overall matching', () => {
    it('should match perfect job', () => {
      const job = createJobInput();
      const result = matchJob(job);
      expect(result.isMatch).toBe(true);
      expect(result.score).toBeGreaterThan(70);
    });

    it('should not match if location is wrong', () => {
      const job = createJobInput({ remoteType: 'us-only' });
      const result = matchJob(job);
      expect(result.isMatch).toBe(false);
    });

    it('should not match if tech and role dont match', () => {
      const job = createJobInput({
        title: 'Data Engineer',
        techStack: ['Python', 'Spark'],
        requiredSkills: ['SQL', 'ETL'],
      });
      const result = matchJob(job);
      expect(result.isMatch).toBe(false);
    });

    it('should match job with 3+ criteria and good score', () => {
      const job = createJobInput({
        seniorityLevel: 'mid',
        title: 'React Developer',
        techStack: ['React', 'JavaScript'],
        remoteType: 'worldwide',
      });
      const result = matchJob(job);
      expect(result.criteria.techMatch).toBe(true);
      expect(result.criteria.roleMatch).toBe(true);
      expect(result.criteria.locationMatch).toBe(true);
    });
  });

  describe('score calculation', () => {
    it('should give higher score to senior roles', () => {
      const seniorJob = createJobInput({ seniorityLevel: 'senior' });
      const midJob = createJobInput({ seniorityLevel: 'mid' });

      const seniorResult = matchJob(seniorJob);
      const midResult = matchJob(midJob);

      expect(seniorResult.score).toBeGreaterThan(midResult.score);
    });

    it('should give bonus for React Native roles', () => {
      const rnJob = createJobInput({
        title: 'React Native Developer',
        seniorityLevel: 'mid',
        techStack: ['React Native'],
      });
      const reactJob = createJobInput({
        title: 'React Developer',
        seniorityLevel: 'mid',
        techStack: ['React'],
      });

      const rnResult = matchJob(rnJob);
      const reactResult = matchJob(reactJob);

      expect(rnResult.score).toBeGreaterThan(reactResult.score);
    });

    it('should give bonus for worldwide remote', () => {
      const worldwideJob = createJobInput({
        remoteType: 'worldwide',
        seniorityLevel: 'mid',
        techStack: ['React'],
      });
      const europeJob = createJobInput({
        remoteType: 'europe',
        seniorityLevel: 'mid',
        techStack: ['React'],
      });

      const worldwideResult = matchJob(worldwideJob);
      const europeResult = matchJob(europeJob);

      expect(worldwideResult.score).toBeGreaterThan(europeResult.score);
    });

    it('should cap score at 100', () => {
      const perfectJob = createJobInput({
        title: 'Senior React Native Developer',
        seniorityLevel: 'senior',
        techStack: ['React', 'React Native', 'TypeScript', 'Node.js', 'GraphQL'],
        remoteType: 'worldwide',
      });

      const result = matchJob(perfectJob);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('match and reject reasons', () => {
    it('should include seniority in match reasons', () => {
      const job = createJobInput();
      const result = matchJob(job);
      expect(result.matchReasons.some((r) => r.includes('Seniority'))).toBe(true);
    });

    it('should include tech stack in match reasons', () => {
      const job = createJobInput();
      const result = matchJob(job);
      expect(result.matchReasons.some((r) => r.includes('Tech'))).toBe(true);
    });

    it('should include reject reason for wrong seniority', () => {
      const job = createJobInput({ seniorityLevel: 'junior' });
      const result = matchJob(job);
      expect(result.rejectReasons.some((r) => r.includes('Seniority'))).toBe(true);
    });

    it('should include reject reason for location', () => {
      const job = createJobInput({ remoteType: 'us-only' });
      const result = matchJob(job);
      expect(result.rejectReasons.some((r) => r.includes('Location'))).toBe(true);
    });
  });

  describe('custom filter config', () => {
    it('should use custom target seniority', () => {
      const config = createFilterConfig({
        targetSeniority: ['mid', 'senior'],
      });
      const matcher = new JobMatcher(config);

      const midJob = createJobInput({ seniorityLevel: 'mid' });
      const result = matcher.match(midJob);

      expect(result.criteria.seniorityMatch).toBe(true);
    });

    it('should use custom user country', () => {
      const config = createFilterConfig({
        userCountry: 'belarus',
      });
      const matcher = new JobMatcher(config);

      const job = createJobInput({ remoteType: 'europe' });
      const result = matcher.match(job);

      expect(result.criteria.locationMatch).toBe(true);
    });
  });
});
