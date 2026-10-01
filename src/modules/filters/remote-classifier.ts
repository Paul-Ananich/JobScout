import type { RemoteType } from '../../shared/types.js';

import type { RemoteEligibility } from './types.js';

const EU_COUNTRIES = new Set([
  'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic',
  'czechia', 'denmark', 'estonia', 'finland', 'france', 'germany', 'greece',
  'hungary', 'ireland', 'italy', 'latvia', 'lithuania', 'luxembourg', 'malta',
  'netherlands', 'poland', 'portugal', 'romania', 'slovakia', 'slovenia',
  'spain', 'sweden',
]);

const EUROPE_COUNTRIES = new Set([
  ...EU_COUNTRIES,
  'united kingdom', 'uk', 'switzerland', 'norway', 'iceland', 'liechtenstein',
  'albania', 'andorra', 'armenia', 'azerbaijan', 'belarus', 'bosnia',
  'georgia', 'kazakhstan', 'kosovo', 'macedonia', 'moldova', 'monaco',
  'montenegro', 'russia', 'san marino', 'serbia', 'turkey', 'ukraine',
  'vatican',
]);

const EMEA_REGIONS = new Set([
  ...EUROPE_COUNTRIES,
  'south africa', 'nigeria', 'kenya', 'egypt', 'morocco', 'ghana',
  'uae', 'united arab emirates', 'saudi arabia', 'israel', 'qatar',
  'bahrain', 'kuwait', 'oman', 'jordan', 'lebanon',
]);

export function classifyRemoteEligibility(
  remoteType: RemoteType,
  locationRestrictions: string[],
  userCountry: string
): RemoteEligibility {
  const normalizedCountry = userCountry.toLowerCase().trim();
  const normalizedRestrictions = locationRestrictions.map((r) => r.toLowerCase().trim());

  switch (remoteType) {
    case 'worldwide':
      return {
        eligible: true,
        reason: 'Position is open worldwide',
        confidence: 'high',
      };

    case 'onsite':
      return {
        eligible: false,
        reason: 'Position requires onsite presence',
        confidence: 'high',
      };

    case 'hybrid':
      return {
        eligible: false,
        reason: 'Position requires hybrid/partial office presence',
        confidence: 'high',
      };

    case 'us-only':
      return {
        eligible: false,
        reason: 'Position is restricted to US residents',
        confidence: 'high',
      };

    case 'eu-only':
      if (EU_COUNTRIES.has(normalizedCountry)) {
        return {
          eligible: true,
          reason: `${userCountry} is an EU member state`,
          confidence: 'high',
        };
      }
      return {
        eligible: false,
        reason: `${userCountry} is not an EU member state`,
        confidence: 'high',
      };

    case 'europe':
      if (EUROPE_COUNTRIES.has(normalizedCountry)) {
        return {
          eligible: true,
          reason: `${userCountry} is in Europe`,
          confidence: 'medium',
        };
      }
      return {
        eligible: false,
        reason: `${userCountry} is not in Europe`,
        confidence: 'medium',
      };

    case 'emea':
      if (EMEA_REGIONS.has(normalizedCountry)) {
        return {
          eligible: true,
          reason: `${userCountry} is in EMEA region`,
          confidence: 'medium',
        };
      }
      return {
        eligible: false,
        reason: `${userCountry} is not in EMEA region`,
        confidence: 'medium',
      };

    case 'country-specific':
      return checkCountrySpecificEligibility(
        normalizedRestrictions,
        normalizedCountry,
        userCountry
      );

    case 'unknown':
    default:
      return {
        eligible: false,
        reason: 'Remote policy unclear - assuming not eligible',
        confidence: 'low',
      };
  }
}

function checkCountrySpecificEligibility(
  restrictions: string[],
  normalizedCountry: string,
  originalCountry: string
): RemoteEligibility {
  if (restrictions.length === 0) {
    return {
      eligible: false,
      reason: 'Country-specific but no countries specified',
      confidence: 'low',
    };
  }

  for (const restriction of restrictions) {
    if (restriction.includes(normalizedCountry)) {
      return {
        eligible: true,
        reason: `${originalCountry} is in the allowed countries list`,
        confidence: 'high',
      };
    }

    if (
      restriction.includes('worldwide') ||
      restriction.includes('global') ||
      restriction.includes('anywhere')
    ) {
      return {
        eligible: true,
        reason: 'Position allows worldwide applicants',
        confidence: 'high',
      };
    }

    if (restriction.includes('europe') && EUROPE_COUNTRIES.has(normalizedCountry)) {
      return {
        eligible: true,
        reason: `${originalCountry} is in Europe (allowed region)`,
        confidence: 'medium',
      };
    }

    if (restriction.includes('emea') && EMEA_REGIONS.has(normalizedCountry)) {
      return {
        eligible: true,
        reason: `${originalCountry} is in EMEA (allowed region)`,
        confidence: 'medium',
      };
    }

    if (
      (restriction.includes('eu') || restriction.includes('european union')) &&
      EU_COUNTRIES.has(normalizedCountry)
    ) {
      return {
        eligible: true,
        reason: `${originalCountry} is in EU (allowed region)`,
        confidence: 'medium',
      };
    }

    if (restriction.includes('cis') || restriction.includes('eastern europe')) {
      const cisCountries = ['georgia', 'belarus', 'ukraine', 'moldova', 'armenia', 'azerbaijan'];
      if (cisCountries.includes(normalizedCountry)) {
        return {
          eligible: true,
          reason: `${originalCountry} is in CIS/Eastern Europe (allowed region)`,
          confidence: 'medium',
        };
      }
    }
  }

  return {
    eligible: false,
    reason: `${originalCountry} not in allowed countries: ${restrictions.join(', ')}`,
    confidence: 'medium',
  };
}

export function isRemoteTypeAcceptable(
  remoteType: RemoteType,
  acceptedTypes: RemoteType[]
): boolean {
  return acceptedTypes.includes(remoteType);
}
