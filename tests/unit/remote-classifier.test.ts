import { describe, it, expect } from 'vitest';

import {
  classifyRemoteEligibility,
  isRemoteTypeAcceptable,
} from '../../src/modules/filters/remote-classifier.js';
import type { RemoteType } from '../../src/shared/types.js';

describe('Remote Classifier', () => {
  describe('classifyRemoteEligibility', () => {
    describe('worldwide remote', () => {
      it('should allow worldwide remote for any country', () => {
        const result = classifyRemoteEligibility('worldwide', [], 'Georgia');
        expect(result.eligible).toBe(true);
        expect(result.confidence).toBe('high');
      });

      it('should allow worldwide remote for Belarus', () => {
        const result = classifyRemoteEligibility('worldwide', [], 'Belarus');
        expect(result.eligible).toBe(true);
      });
    });

    describe('onsite positions', () => {
      it('should reject onsite positions', () => {
        const result = classifyRemoteEligibility('onsite', [], 'Georgia');
        expect(result.eligible).toBe(false);
        expect(result.confidence).toBe('high');
      });
    });

    describe('hybrid positions', () => {
      it('should reject hybrid positions', () => {
        const result = classifyRemoteEligibility('hybrid', [], 'Georgia');
        expect(result.eligible).toBe(false);
        expect(result.reason).toContain('hybrid');
      });
    });

    describe('US-only remote', () => {
      it('should reject US-only for non-US countries', () => {
        const result = classifyRemoteEligibility('us-only', [], 'Georgia');
        expect(result.eligible).toBe(false);
        expect(result.confidence).toBe('high');
      });

      it('should reject US-only for Belarus', () => {
        const result = classifyRemoteEligibility('us-only', [], 'Belarus');
        expect(result.eligible).toBe(false);
      });
    });

    describe('EU-only remote', () => {
      it('should reject EU-only for Georgia (not EU)', () => {
        const result = classifyRemoteEligibility('eu-only', [], 'Georgia');
        expect(result.eligible).toBe(false);
        expect(result.reason).toContain('not an EU member');
      });

      it('should reject EU-only for Belarus', () => {
        const result = classifyRemoteEligibility('eu-only', [], 'Belarus');
        expect(result.eligible).toBe(false);
      });

      it('should allow EU-only for Germany', () => {
        const result = classifyRemoteEligibility('eu-only', [], 'Germany');
        expect(result.eligible).toBe(true);
      });

      it('should allow EU-only for France', () => {
        const result = classifyRemoteEligibility('eu-only', [], 'France');
        expect(result.eligible).toBe(true);
      });

      it('should allow EU-only for Poland', () => {
        const result = classifyRemoteEligibility('eu-only', [], 'Poland');
        expect(result.eligible).toBe(true);
      });
    });

    describe('Europe remote', () => {
      it('should allow Europe remote for Georgia', () => {
        const result = classifyRemoteEligibility('europe', [], 'Georgia');
        expect(result.eligible).toBe(true);
        expect(result.confidence).toBe('medium');
      });

      it('should allow Europe remote for Belarus', () => {
        const result = classifyRemoteEligibility('europe', [], 'Belarus');
        expect(result.eligible).toBe(true);
      });

      it('should allow Europe remote for UK', () => {
        const result = classifyRemoteEligibility('europe', [], 'UK');
        expect(result.eligible).toBe(true);
      });

      it('should allow Europe remote for Switzerland', () => {
        const result = classifyRemoteEligibility('europe', [], 'Switzerland');
        expect(result.eligible).toBe(true);
      });

      it('should reject Europe remote for USA', () => {
        const result = classifyRemoteEligibility('europe', [], 'USA');
        expect(result.eligible).toBe(false);
      });
    });

    describe('EMEA remote', () => {
      it('should allow EMEA remote for Georgia', () => {
        const result = classifyRemoteEligibility('emea', [], 'Georgia');
        expect(result.eligible).toBe(true);
      });

      it('should allow EMEA remote for Belarus', () => {
        const result = classifyRemoteEligibility('emea', [], 'Belarus');
        expect(result.eligible).toBe(true);
      });

      it('should allow EMEA remote for South Africa', () => {
        const result = classifyRemoteEligibility('emea', [], 'South Africa');
        expect(result.eligible).toBe(true);
      });

      it('should allow EMEA remote for UAE', () => {
        const result = classifyRemoteEligibility('emea', [], 'UAE');
        expect(result.eligible).toBe(true);
      });

      it('should reject EMEA remote for USA', () => {
        const result = classifyRemoteEligibility('emea', [], 'USA');
        expect(result.eligible).toBe(false);
      });
    });

    describe('country-specific remote', () => {
      it('should allow when country is in list', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['Georgia', 'Armenia'],
          'Georgia'
        );
        expect(result.eligible).toBe(true);
      });

      it('should reject when country is not in list', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['Germany', 'France'],
          'Georgia'
        );
        expect(result.eligible).toBe(false);
      });

      it('should allow when "worldwide" is in restrictions', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['worldwide'],
          'Georgia'
        );
        expect(result.eligible).toBe(true);
      });

      it('should allow when "global" is in restrictions', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['global'],
          'Belarus'
        );
        expect(result.eligible).toBe(true);
      });

      it('should allow Europe region for Georgia', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['Europe'],
          'Georgia'
        );
        expect(result.eligible).toBe(true);
      });

      it('should allow EMEA region for Belarus', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['EMEA region'],
          'Belarus'
        );
        expect(result.eligible).toBe(true);
      });

      it('should allow CIS for Georgia', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['CIS countries'],
          'Georgia'
        );
        expect(result.eligible).toBe(true);
      });

      it('should allow Eastern Europe for Belarus', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['Eastern Europe'],
          'Belarus'
        );
        expect(result.eligible).toBe(true);
      });

      it('should handle empty restrictions list', () => {
        const result = classifyRemoteEligibility('country-specific', [], 'Georgia');
        expect(result.eligible).toBe(false);
        expect(result.confidence).toBe('low');
      });
    });

    describe('unknown remote type', () => {
      it('should reject unknown remote type', () => {
        const result = classifyRemoteEligibility('unknown', [], 'Georgia');
        expect(result.eligible).toBe(false);
        expect(result.confidence).toBe('low');
      });
    });

    describe('case insensitivity', () => {
      it('should handle uppercase country names', () => {
        const result = classifyRemoteEligibility('europe', [], 'GEORGIA');
        expect(result.eligible).toBe(true);
      });

      it('should handle mixed case in restrictions', () => {
        const result = classifyRemoteEligibility(
          'country-specific',
          ['GEORGIA', 'Belarus'],
          'georgia'
        );
        expect(result.eligible).toBe(true);
      });
    });
  });

  describe('isRemoteTypeAcceptable', () => {
    it('should return true when type is in accepted list', () => {
      const accepted: RemoteType[] = ['worldwide', 'europe', 'emea'];
      expect(isRemoteTypeAcceptable('worldwide', accepted)).toBe(true);
      expect(isRemoteTypeAcceptable('europe', accepted)).toBe(true);
    });

    it('should return false when type is not in accepted list', () => {
      const accepted: RemoteType[] = ['worldwide', 'europe'];
      expect(isRemoteTypeAcceptable('us-only', accepted)).toBe(false);
      expect(isRemoteTypeAcceptable('onsite', accepted)).toBe(false);
    });
  });
});
