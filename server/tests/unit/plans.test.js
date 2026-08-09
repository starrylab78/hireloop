import { describe, it, expect } from 'vitest';
import { PLANS } from '../../src/config/plans.js';

describe('PLANS config', () => {
  it('Free plan has the most restrictive limits', () => {
    expect(PLANS.free.maxActiveJobs).toBeLessThan(PLANS.growth.maxActiveJobs);
    expect(PLANS.free.atsPipeline).toBe(false);
    expect(PLANS.free.csvExport).toBe(false);
  });

  it('Scale plan has unlimited job posts and every feature Growth has', () => {
    expect(PLANS.scale.maxActiveJobs).toBe(Infinity);
    for (const key of ['atsPipeline', 'applicantFiltering', 'csvExport', 'usageAnalytics']) {
      if (PLANS.growth[key]) expect(PLANS.scale[key]).toBe(true);
    }
  });

  it('every plan tier is strictly more capable than the one below it', () => {
    expect(PLANS.growth.maxActiveJobs).toBeGreaterThan(PLANS.free.maxActiveJobs);
    expect(PLANS.scale.teamSeats).toBeGreaterThan(PLANS.growth.teamSeats);
  });
});
