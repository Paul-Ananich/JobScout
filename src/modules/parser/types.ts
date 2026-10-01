import type { RawJobData } from '../../shared/types.js';

export interface ParseResult {
  success: boolean;
  jobs: RawJobData[];
  errors: string[];
  metadata: {
    emailSubject: string;
    emailFrom: string;
    jobCount: number;
    parseTime: number;
  };
}

export interface LinkedInJobEntry {
  title: string;
  company: string;
  location?: string;
  url: string;
  postedTime?: string;
}

export interface ParserConfig {
  source: string;
  maxJobsPerEmail?: number;
}
