import type { Job, JobAnalysis } from '@prisma/client';

import { AnalysisError } from '../../shared/errors.js';
import { createChildLogger } from '../../shared/logger.js';
import type { JobAnalysisResult } from '../../shared/types.js';
import { jobRepository } from '../jobs/repository.js';

import { LlmClient, createLlmClient } from './llm.js';
import { ANALYSIS_SYSTEM_PROMPT, createAnalysisPrompt } from './prompts.js';
import { parseJsonFromLlm, validateAnalysis, type JobAnalysisOutput } from './schema.js';

const logger = createChildLogger('analyzer:service');

export class AnalyzerService {
  private llmClient: LlmClient;

  constructor(config: { apiKey: string; model: string }) {
    this.llmClient = createLlmClient(config);
  }

  async analyzeJob(job: Job): Promise<JobAnalysisResult> {
    logger.info({ jobId: job.id, title: job.title }, 'Analyzing job');

    const prompt = createAnalysisPrompt({
      title: job.title,
      company: job.company,
      location: job.location ?? undefined,
      description: job.description ?? undefined,
    });

    const rawResponse = await this.llmClient.analyze(ANALYSIS_SYSTEM_PROMPT, prompt);

    const parsed = parseJsonFromLlm(rawResponse);
    if (!parsed) {
      throw new AnalysisError('Failed to parse LLM response as JSON', {
        rawResponse,
      });
    }

    let analysis: JobAnalysisOutput | null = null;

    if (typeof parsed === 'object' && parsed !== null && 'analysis' in parsed) {
      analysis = validateAnalysis((parsed as { analysis: unknown }).analysis);
    } else {
      analysis = validateAnalysis(parsed);
    }

    if (!analysis) {
      throw new AnalysisError('Invalid analysis structure from LLM', {
        parsed,
      });
    }

    logger.debug({ jobId: job.id, analysis }, 'Job analysis completed');

    return {
      seniorityLevel: analysis.seniorityLevel,
      requiredSkills: analysis.requiredSkills,
      techStack: analysis.techStack,
      remoteType: analysis.remoteType,
      locationRestrictions: analysis.locationRestrictions,
      experienceYears: analysis.experienceYears,
    };
  }

  async analyzeAndSave(job: Job): Promise<JobAnalysis> {
    try {
      const analysis = await this.analyzeJob(job);

      const saved = await jobRepository.createAnalysis(job.id, {
        status: 'completed',
        seniorityLevel: analysis.seniorityLevel,
        requiredSkills: analysis.requiredSkills,
        techStack: analysis.techStack,
        remoteType: analysis.remoteType,
        locationRestrictions: analysis.locationRestrictions,
        experienceYears: analysis.experienceYears,
        analyzedAt: new Date(),
      });

      logger.info({ jobId: job.id, analysisId: saved.id }, 'Saved job analysis');
      return saved;
    } catch (error) {
      logger.error({ jobId: job.id, error }, 'Failed to analyze job');

      const failed = await jobRepository.createAnalysis(job.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
        retryCount: 1,
      });

      return failed;
    }
  }

  async processJobBatch(jobs: Job[]): Promise<{ analyzed: number; failed: number }> {
    let analyzed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const result = await this.analyzeAndSave(job);
        if (result.status === 'completed') {
          analyzed++;
        } else {
          failed++;
        }
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'Unexpected error during analysis');
        failed++;
      }
    }

    logger.info({ analyzed, failed, total: jobs.length }, 'Processed job batch');
    return { analyzed, failed };
  }
}

export function createAnalyzerService(config: { apiKey: string; model: string }): AnalyzerService {
  return new AnalyzerService(config);
}
