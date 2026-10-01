import type { RemoteType, SeniorityLevel } from '../../shared/types.js';

export interface FilterConfig {
  targetSeniority: SeniorityLevel[];
  targetTechStack: string[];
  targetRoles: string[];
  acceptedRemoteTypes: RemoteType[];
  userCountry: string;
  acceptedCountries: string[];
}

export interface RemoteEligibility {
  eligible: boolean;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface MatchCriteria {
  seniorityMatch: boolean;
  techMatch: boolean;
  roleMatch: boolean;
  locationMatch: boolean;
}

export interface MatchResult {
  isMatch: boolean;
  score: number;
  matchReasons: string[];
  rejectReasons: string[];
  criteria: MatchCriteria;
}

export interface JobMatchInput {
  title: string;
  company: string;
  seniorityLevel: SeniorityLevel;
  techStack: string[];
  requiredSkills: string[];
  remoteType: RemoteType;
  locationRestrictions: string[];
}
