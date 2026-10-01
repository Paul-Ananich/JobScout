import type { FilterConfig } from './types.js';

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  targetSeniority: ['senior', 'lead', 'staff', 'principal'],

  targetTechStack: [
    'react',
    'react native',
    'typescript',
    'javascript',
    'node',
    'nodejs',
    'next.js',
    'nextjs',
    'expo',
    'redux',
    'graphql',
    'rest api',
    'css',
    'html',
    'tailwind',
    'styled-components',
  ],

  targetRoles: [
    'frontend',
    'front-end',
    'front end',
    'react',
    'react native',
    'mobile',
    'ui',
    'full stack',
    'fullstack',
    'full-stack',
    'javascript',
    'typescript',
    'web developer',
    'software engineer',
  ],

  acceptedRemoteTypes: ['worldwide', 'europe', 'emea', 'country-specific'],

  userCountry: 'georgia',

  acceptedCountries: [
    'worldwide',
    'global',
    'anywhere',
    'georgia',
    'belarus',
    'europe',
    'emea',
    'eastern europe',
    'cis',
  ],
};

export function createFilterConfig(overrides: Partial<FilterConfig> = {}): FilterConfig {
  return {
    ...DEFAULT_FILTER_CONFIG,
    ...overrides,
    targetSeniority: overrides.targetSeniority ?? DEFAULT_FILTER_CONFIG.targetSeniority,
    targetTechStack: overrides.targetTechStack ?? DEFAULT_FILTER_CONFIG.targetTechStack,
    targetRoles: overrides.targetRoles ?? DEFAULT_FILTER_CONFIG.targetRoles,
    acceptedRemoteTypes: overrides.acceptedRemoteTypes ?? DEFAULT_FILTER_CONFIG.acceptedRemoteTypes,
    acceptedCountries: overrides.acceptedCountries ?? DEFAULT_FILTER_CONFIG.acceptedCountries,
  };
}
