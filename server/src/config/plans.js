// Single source of truth for subscription tiers.
// Every server-side feature gate reads from here — never trust the client.

export const PLAN_IDS = ['free', 'growth', 'scale'];

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyINR: 0,
    priceAnnualINR: 0,
    maxActiveJobs: 1,
    atsPipeline: false,
    applicantFiltering: false,
    csvExport: false,
    teamSeats: 1,
    priorityListing: false,
    usageAnalytics: false,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceMonthlyINR: 999,
    priceAnnualINR: 999 * 10, // ~2 months free annually
    maxActiveJobs: 10,
    atsPipeline: true,
    applicantFiltering: true,
    csvExport: true,
    teamSeats: 1,
    priorityListing: false,
    usageAnalytics: true,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    priceMonthlyINR: 2999,
    priceAnnualINR: 2999 * 10,
    maxActiveJobs: Infinity,
    atsPipeline: true,
    applicantFiltering: true,
    csvExport: true,
    teamSeats: 5,
    priorityListing: true,
    usageAnalytics: true,
  },
};

export function getRazorpayPlanId(planId, interval) {
  const key = `RAZORPAY_PLAN_${planId.toUpperCase()}_${interval.toUpperCase()}`;
  return process.env[key];
}

export function planFromRazorpayPlanId(razorpayPlanId) {
  for (const interval of ['MONTHLY', 'ANNUAL']) {
    for (const planId of ['GROWTH', 'SCALE']) {
      if (process.env[`RAZORPAY_PLAN_${planId}_${interval}`] === razorpayPlanId) {
        return planId.toLowerCase();
      }
    }
  }
  return null;
}
