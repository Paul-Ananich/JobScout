import type { Job, JobAnalysis, Prisma } from '@prisma/client';

import { getDbClient } from '../../db/client.js';
import { createChildLogger } from '../../shared/logger.js';

import type {
  CreateJobInput,
  UpdateJobInput,
  JobWithAnalysis,
  JobWithRelations,
  JobFilter,
  PaginationOptions,
} from './types.js';

const logger = createChildLogger('jobs:repository');

export class JobRepository {
  private get db() {
    return getDbClient();
  }

  async create(input: CreateJobInput): Promise<Job> {
    logger.debug({ input }, 'Creating job');

    return this.db.job.create({
      data: {
        source: input.source,
        externalId: input.externalId,
        url: input.url,
        urlHash: input.urlHash,
        title: input.title,
        company: input.company,
        location: input.location,
        description: input.description,
        salary: input.salary,
        postedAt: input.postedAt,
        rawContent: input.rawContent,
      },
    });
  }

  async findById(id: string): Promise<JobWithRelations | null> {
    return this.db.job.findUnique({
      where: { id },
      include: {
        analysis: true,
        notifications: true,
      },
    });
  }

  async findByExternalId(source: string, externalId: string): Promise<Job | null> {
    return this.db.job.findUnique({
      where: {
        source_externalId: {
          source,
          externalId,
        },
      },
    });
  }

  async findByUrlHash(urlHash: string): Promise<Job | null> {
    return this.db.job.findFirst({
      where: { urlHash },
    });
  }

  async findMany(
    filter: JobFilter = {},
    pagination: PaginationOptions = {}
  ): Promise<JobWithAnalysis[]> {
    const { skip = 0, take = 50, orderBy = 'createdAt', order = 'desc' } = pagination;

    const where: Prisma.JobWhereInput = {};

    if (filter.source) {
      where.source = filter.source;
    }

    if (filter.hasAnalysis !== undefined) {
      where.analysis = filter.hasAnalysis ? { isNot: null } : { is: null };
    }

    if (filter.isMatch !== undefined) {
      where.analysis = {
        ...((where.analysis as Prisma.JobAnalysisWhereInput) || {}),
        isMatch: filter.isMatch,
      };
    }

    if (filter.createdAfter) {
      where.createdAt = { ...((where.createdAt as object) || {}), gte: filter.createdAfter };
    }

    if (filter.createdBefore) {
      where.createdAt = { ...((where.createdAt as object) || {}), lte: filter.createdBefore };
    }

    return this.db.job.findMany({
      where,
      include: { analysis: true },
      skip,
      take,
      orderBy: { [orderBy]: order },
    });
  }

  async findPendingAnalysis(limit: number = 10): Promise<Job[]> {
    return this.db.job.findMany({
      where: {
        analysis: null,
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMatchedUnnotified(limit: number = 10): Promise<JobWithAnalysis[]> {
    return this.db.job.findMany({
      where: {
        analysis: {
          isMatch: true,
        },
        notifications: {
          none: {
            status: 'sent',
          },
        },
      },
      include: { analysis: true },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, input: UpdateJobInput): Promise<Job> {
    return this.db.job.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.job.delete({
      where: { id },
    });
  }

  async createAnalysis(
    jobId: string,
    analysis: Omit<Prisma.JobAnalysisCreateInput, 'job'>
  ): Promise<JobAnalysis> {
    return this.db.jobAnalysis.create({
      data: {
        ...analysis,
        job: { connect: { id: jobId } },
      },
    });
  }

  async updateAnalysis(
    jobId: string,
    analysis: Partial<Prisma.JobAnalysisUpdateInput>
  ): Promise<JobAnalysis> {
    return this.db.jobAnalysis.update({
      where: { jobId },
      data: analysis,
    });
  }

  async count(filter: JobFilter = {}): Promise<number> {
    const where: Prisma.JobWhereInput = {};

    if (filter.source) {
      where.source = filter.source;
    }

    if (filter.isMatch !== undefined) {
      where.analysis = { isMatch: filter.isMatch };
    }

    return this.db.job.count({ where });
  }
}

export const jobRepository = new JobRepository();
