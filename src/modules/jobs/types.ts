import type { Job, JobAnalysis, Notification } from '@prisma/client';

export type JobWithAnalysis = Job & {
  analysis: JobAnalysis | null;
};

export type JobWithRelations = Job & {
  analysis: JobAnalysis | null;
  notifications: Notification[];
};

export interface CreateJobInput {
  source: string;
  externalId?: string;
  url: string;
  urlHash: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salary?: string;
  postedAt?: Date;
  rawContent?: string;
}

export interface UpdateJobInput {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  salary?: string;
  postedAt?: Date;
}

export interface JobFilter {
  source?: string;
  hasAnalysis?: boolean;
  isMatch?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface PaginationOptions {
  skip?: number;
  take?: number;
  orderBy?: 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

export interface DeduplicationResult {
  isDuplicate: boolean;
  existingJobId?: string;
  matchType?: 'externalId' | 'urlHash' | 'similarity';
}
