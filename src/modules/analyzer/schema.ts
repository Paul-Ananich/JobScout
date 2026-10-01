import { z } from 'zod';

export const seniorityLevelSchema = z.enum([
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'staff',
  'principal',
  'manager',
  'director',
  'unknown',
]);

export const remoteTypeSchema = z.enum([
  'worldwide',
  'europe',
  'eu-only',
  'emea',
  'us-only',
  'country-specific',
  'hybrid',
  'onsite',
  'unknown',
]);

export const jobAnalysisSchema = z.object({
  seniorityLevel: seniorityLevelSchema,
  requiredSkills: z.array(z.string()),
  techStack: z.array(z.string()),
  remoteType: remoteTypeSchema,
  locationRestrictions: z.array(z.string()),
  experienceYears: z.number().int().min(0).max(30).optional(),
  reasoning: z.string().optional(),
});

export type JobAnalysisOutput = z.infer<typeof jobAnalysisSchema>;

export const llmResponseSchema = z.object({
  analysis: jobAnalysisSchema,
});

export function validateAnalysis(data: unknown): JobAnalysisOutput | null {
  const result = jobAnalysisSchema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  return null;
}

export function parseJsonFromLlm(text: string): unknown | null {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(jsonText?.trim() ?? '');
  } catch {
    const cleanedText = text
      .replace(/^[^{[]*/, '')
      .replace(/[^}\]]*$/, '');

    try {
      return JSON.parse(cleanedText);
    } catch {
      return null;
    }
  }
}
