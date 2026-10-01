export interface RawJobData {
  source: string;
  externalId?: string;
  url: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  salary?: string;
  postedAt?: Date;
  rawContent?: string;
}

export interface ParsedEmail {
  messageId: string;
  threadId?: string;
  subject: string;
  from: string;
  receivedAt: Date;
  body: string;
  jobs: RawJobData[];
}

export type RemoteType =
  | 'worldwide'
  | 'europe'
  | 'eu-only'
  | 'emea'
  | 'us-only'
  | 'country-specific'
  | 'hybrid'
  | 'onsite'
  | 'unknown';

export type SeniorityLevel =
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'staff'
  | 'principal'
  | 'manager'
  | 'director'
  | 'unknown';

export interface JobAnalysisResult {
  seniorityLevel: SeniorityLevel;
  requiredSkills: string[];
  techStack: string[];
  remoteType: RemoteType;
  locationRestrictions: string[];
  experienceYears?: number;
}

export interface FilterConfig {
  targetSeniority: SeniorityLevel[];
  targetTechStack: string[];
  targetRoles: string[];
  acceptedRemoteTypes: RemoteType[];
  userCountry: string;
  acceptedCountries: string[];
}

export interface MatchResult {
  isMatch: boolean;
  score: number;
  matchReasons: string[];
  rejectReasons: string[];
}

export interface TelegramMessage {
  text: string;
  parseMode: 'HTML' | 'MarkdownV2';
  replyMarkup?: TelegramInlineKeyboard;
}

export interface TelegramInlineKeyboard {
  inline_keyboard: TelegramInlineButton[][];
}

export interface TelegramInlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export type JobStatus = 'new' | 'analyzed' | 'matched' | 'rejected' | 'notified' | 'error';

export type AnalysisStatus = 'pending' | 'completed' | 'failed';

export type NotificationStatus = 'pending' | 'sent' | 'failed';
