import type { RemoteType, SeniorityLevel } from '../../shared/types.js';

import { DEFAULT_FILTER_CONFIG } from './config.js';
import { classifyRemoteEligibility } from './remote-classifier.js';
import type { FilterConfig, MatchResult, JobMatchInput, MatchCriteria } from './types.js';

export class JobMatcher {
  private config: FilterConfig;

  constructor(config: FilterConfig = DEFAULT_FILTER_CONFIG) {
    this.config = config;
  }

  match(job: JobMatchInput): MatchResult {
    const criteria: MatchCriteria = {
      seniorityMatch: this.checkSeniority(job.seniorityLevel),
      techMatch: this.checkTechStack(job.techStack, job.requiredSkills),
      roleMatch: this.checkRole(job.title),
      locationMatch: this.checkLocation(job.remoteType, job.locationRestrictions),
    };

    const matchReasons: string[] = [];
    const rejectReasons: string[] = [];

    if (criteria.seniorityMatch) {
      matchReasons.push(`Seniority: ${job.seniorityLevel}`);
    } else {
      rejectReasons.push(`Seniority ${job.seniorityLevel} not in target: ${this.config.targetSeniority.join(', ')}`);
    }

    if (criteria.techMatch) {
      const matchedTech = this.findMatchingTech(job.techStack, job.requiredSkills);
      matchReasons.push(`Tech: ${matchedTech.join(', ')}`);
    } else {
      rejectReasons.push(`No matching tech stack found`);
    }

    if (criteria.roleMatch) {
      matchReasons.push(`Role matches target criteria`);
    } else {
      rejectReasons.push(`Role "${job.title}" doesn't match target roles`);
    }

    if (criteria.locationMatch) {
      matchReasons.push(`Location: ${job.remoteType} is acceptable`);
    } else {
      const eligibility = classifyRemoteEligibility(
        job.remoteType,
        job.locationRestrictions,
        this.config.userCountry
      );
      rejectReasons.push(`Location: ${eligibility.reason}`);
    }

    const score = this.calculateScore(criteria, job);
    const isMatch = this.determineMatch(criteria, score);

    return {
      isMatch,
      score,
      matchReasons,
      rejectReasons,
      criteria,
    };
  }

  private checkSeniority(level: SeniorityLevel): boolean {
    return this.config.targetSeniority.includes(level);
  }

  private checkTechStack(techStack: string[], skills: string[]): boolean {
    const allTech = [...techStack, ...skills].map((t) => t.toLowerCase());
    const targetTech = this.config.targetTechStack.map((t) => t.toLowerCase());

    return allTech.some((tech) =>
      targetTech.some(
        (target) => tech.includes(target) || target.includes(tech)
      )
    );
  }

  private findMatchingTech(techStack: string[], skills: string[]): string[] {
    const allTech = [...techStack, ...skills];
    const targetTech = this.config.targetTechStack.map((t) => t.toLowerCase());

    return allTech.filter((tech) =>
      targetTech.some(
        (target) =>
          tech.toLowerCase().includes(target) || target.includes(tech.toLowerCase())
      )
    );
  }

  private checkRole(title: string): boolean {
    const lowerTitle = title.toLowerCase();
    return this.config.targetRoles.some((role) => lowerTitle.includes(role.toLowerCase()));
  }

  private checkLocation(remoteType: RemoteType, restrictions: string[]): boolean {
    if (!this.config.acceptedRemoteTypes.includes(remoteType)) {
      if (remoteType !== 'country-specific') {
        return false;
      }
    }

    const eligibility = classifyRemoteEligibility(
      remoteType,
      restrictions,
      this.config.userCountry
    );

    return eligibility.eligible;
  }

  private calculateScore(criteria: MatchCriteria, job: JobMatchInput): number {
    let score = 0;
    const weights = {
      seniority: 25,
      tech: 30,
      role: 25,
      location: 20,
    };

    if (criteria.seniorityMatch) {
      score += weights.seniority;
      if (job.seniorityLevel === 'senior') score += 5;
      if (job.seniorityLevel === 'lead' || job.seniorityLevel === 'staff') score += 3;
    }

    if (criteria.techMatch) {
      score += weights.tech;
      const matchCount = this.findMatchingTech(job.techStack, job.requiredSkills).length;
      score += Math.min(matchCount * 2, 10);
    }

    if (criteria.roleMatch) {
      score += weights.role;
      const lowerTitle = job.title.toLowerCase();
      if (lowerTitle.includes('react native')) score += 10;
      if (lowerTitle.includes('react') && !lowerTitle.includes('native')) score += 5;
      if (lowerTitle.includes('frontend') || lowerTitle.includes('front-end')) score += 5;
    }

    if (criteria.locationMatch) {
      score += weights.location;
      if (job.remoteType === 'worldwide') score += 5;
    }

    return Math.min(score, 100);
  }

  private determineMatch(criteria: MatchCriteria, score: number): boolean {
    if (!criteria.locationMatch) return false;

    if (!criteria.techMatch && !criteria.roleMatch) return false;

    const matchCount = Object.values(criteria).filter(Boolean).length;
    if (matchCount >= 3 && score >= 50) return true;

    if (criteria.techMatch && criteria.roleMatch && criteria.locationMatch) {
      return score >= 40;
    }

    return false;
  }
}

export const defaultMatcher = new JobMatcher();

export function matchJob(job: JobMatchInput, config?: FilterConfig): MatchResult {
  const matcher = config ? new JobMatcher(config) : defaultMatcher;
  return matcher.match(job);
}
