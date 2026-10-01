export const ANALYSIS_SYSTEM_PROMPT = `You are a job posting analyzer. Your task is to extract structured information from job postings.

Analyze the job posting and return a JSON object with the following structure:
{
  "seniorityLevel": "intern" | "junior" | "mid" | "senior" | "lead" | "staff" | "principal" | "manager" | "director" | "unknown",
  "requiredSkills": ["skill1", "skill2", ...],
  "techStack": ["tech1", "tech2", ...],
  "remoteType": "worldwide" | "europe" | "eu-only" | "emea" | "us-only" | "country-specific" | "hybrid" | "onsite" | "unknown",
  "locationRestrictions": ["country1", "region1", ...],
  "experienceYears": number | null,
  "reasoning": "brief explanation of your analysis"
}

Guidelines for seniority:
- "intern": internship positions
- "junior": entry-level, 0-2 years, graduate roles
- "mid": 2-5 years, no senior prefix
- "senior": 5+ years, "senior" in title, significant experience required
- "lead": team lead, tech lead positions
- "staff": staff engineer level
- "principal": principal engineer, architect level
- "manager": engineering manager, team manager
- "director": director level or above

Guidelines for remoteType:
- "worldwide": explicitly states worldwide/global remote, no location restrictions
- "europe": remote within Europe (may include UK)
- "eu-only": specifically EU countries only (excludes UK, Switzerland)
- "emea": Europe, Middle East, Africa region
- "us-only": US-based remote only
- "country-specific": remote but limited to specific countries (list them in locationRestrictions)
- "hybrid": mix of remote and office
- "onsite": office-based, no remote option
- "unknown": remote status unclear

Important notes:
- "Remote" alone does NOT mean worldwide - check for location restrictions
- Many remote jobs have timezone or country restrictions
- Look for phrases like "must be authorized to work in", "based in", "within X timezone"
- EU/EEA work authorization requirements indicate EU-only or country-specific`;

export function createAnalysisPrompt(job: {
  title: string;
  company: string;
  location?: string;
  description?: string;
}): string {
  const parts = [
    `Job Title: ${job.title}`,
    `Company: ${job.company}`,
  ];

  if (job.location) {
    parts.push(`Location: ${job.location}`);
  }

  if (job.description) {
    parts.push(`\nDescription:\n${job.description}`);
  }

  return parts.join('\n');
}

export const ANALYSIS_EXAMPLES = [
  {
    input: {
      title: 'Senior React Developer',
      company: 'TechCorp',
      location: 'Remote (US)',
      description: 'Looking for a senior React developer with 5+ years of experience. Must be authorized to work in the US.',
    },
    output: {
      seniorityLevel: 'senior',
      requiredSkills: ['React', 'JavaScript', 'Frontend Development'],
      techStack: ['React', 'JavaScript'],
      remoteType: 'us-only',
      locationRestrictions: ['US', 'United States'],
      experienceYears: 5,
    },
  },
  {
    input: {
      title: 'React Native Developer',
      company: 'StartupXYZ',
      location: 'Remote - Worldwide',
      description: 'Join our fully remote team! We hire from anywhere in the world. 3+ years experience with React Native.',
    },
    output: {
      seniorityLevel: 'mid',
      requiredSkills: ['React Native', 'Mobile Development', 'JavaScript'],
      techStack: ['React Native', 'JavaScript', 'TypeScript'],
      remoteType: 'worldwide',
      locationRestrictions: [],
      experienceYears: 3,
    },
  },
];
