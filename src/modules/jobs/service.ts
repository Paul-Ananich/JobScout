import type { Job } from '@prisma/client';

import { createChildLogger } from '../../shared/logger.js';
import type { RawJobData } from '../../shared/types.js';
import { hashUrl } from '../../shared/utils.js';

import { jobRepository, JobRepository } from './repository.js';
import type { DeduplicationResult, CreateJobInput } from './types.js';

const logger = createChildLogger('jobs:service');

export class JobService {
  constructor(private repository: JobRepository = jobRepository) {}

  async checkDuplicate(jobData: RawJobData): Promise<DeduplicationResult> {
    if (jobData.externalId) {
      const existing = await this.repository.findByExternalId(
        jobData.source,
        jobData.externalId
      );
      if (existing) {
        logger.debug(
          { source: jobData.source, externalId: jobData.externalId },
          'Found duplicate by externalId'
        );
        return {
          isDuplicate: true,
          existingJobId: existing.id,
          matchType: 'externalId',
        };
      }
    }

    const urlHash = hashUrl(jobData.url);
    const existingByUrl = await this.repository.findByUrlHash(urlHash);
    if (existingByUrl) {
      logger.debug({ url: jobData.url, urlHash }, 'Found duplicate by URL hash');
      return {
        isDuplicate: true,
        existingJobId: existingByUrl.id,
        matchType: 'urlHash',
      };
    }

    return { isDuplicate: false };
  }

  async createJob(jobData: RawJobData): Promise<Job | null> {
    const duplicateCheck = await this.checkDuplicate(jobData);

    if (duplicateCheck.isDuplicate) {
      logger.info(
        {
          title: jobData.title,
          company: jobData.company,
          matchType: duplicateCheck.matchType,
        },
        'Skipping duplicate job'
      );
      return null;
    }

    const urlHash = hashUrl(jobData.url);

    const input: CreateJobInput = {
      source: jobData.source,
      externalId: jobData.externalId,
      url: jobData.url,
      urlHash,
      title: jobData.title,
      company: jobData.company,
      location: jobData.location,
      description: jobData.description,
      salary: jobData.salary,
      postedAt: jobData.postedAt,
      rawContent: jobData.rawContent,
    };

    try {
      const job = await this.repository.create(input);
      logger.info(
        { jobId: job.id, title: job.title, company: job.company },
        'Created new job'
      );
      return job;
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Unique constraint failed')
      ) {
        logger.debug(
          { title: jobData.title, company: jobData.company },
          'Job already exists (race condition)'
        );
        return null;
      }
      throw error;
    }
  }

  async processRawJobs(jobs: RawJobData[]): Promise<{ created: number; duplicates: number }> {
    let created = 0;
    let duplicates = 0;

    for (const jobData of jobs) {
      const result = await this.createJob(jobData);
      if (result) {
        created++;
      } else {
        duplicates++;
      }
    }

    logger.info({ created, duplicates, total: jobs.length }, 'Processed raw jobs');
    return { created, duplicates };
  }

  async getJobsForAnalysis(limit: number = 10): Promise<Job[]> {
    return this.repository.findPendingAnalysis(limit);
  }

  async getMatchedJobsForNotification(limit: number = 10) {
    return this.repository.findMatchedUnnotified(limit);
  }

  async getJobById(id: string) {
    return this.repository.findById(id);
  }

  async getJobStats() {
    const [total, matched, pending] = await Promise.all([
      this.repository.count(),
      this.repository.count({ isMatch: true }),
      this.repository.count({ hasAnalysis: false } as never),
    ]);

    return {
      total,
      matched,
      pending,
      rejected: total - matched - pending,
    };
  }
}

export const jobService = new JobService();
