import OpenAI from 'openai';

import { AnalysisError } from '../../shared/errors.js';
import { createChildLogger } from '../../shared/logger.js';
import { retry } from '../../shared/utils.js';

const logger = createChildLogger('analyzer:llm');

export interface LlmConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
}

export class LlmClient {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(config: LlmConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey });
    this.model = config.model;
    this.maxTokens = config.maxTokens ?? 1000;
    this.temperature = config.temperature ?? 0.1;
  }

  async analyze(systemPrompt: string, userPrompt: string): Promise<string> {
    logger.debug(
      { model: this.model, promptLength: userPrompt.length },
      'Sending request to LLM'
    );

    try {
      const response = await retry(
        async () => {
          const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            response_format: { type: 'json_object' },
          });

          const content = completion.choices[0]?.message?.content;
          if (!content) {
            throw new AnalysisError('Empty response from LLM');
          }

          return content;
        },
        {
          maxRetries: 3,
          baseDelayMs: 1000,
          maxDelayMs: 10000,
        }
      );

      logger.debug({ responseLength: response.length }, 'Received LLM response');
      return response;
    } catch (error) {
      logger.error({ error }, 'LLM request failed');
      throw new AnalysisError('Failed to analyze job with LLM', {
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export function createLlmClient(config: LlmConfig): LlmClient {
  return new LlmClient(config);
}
