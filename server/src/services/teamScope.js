import Organization from '../models/Organization.js';
import User from '../models/User.js';
import { PLANS } from '../config/plans.js';

/**
 * Returns { plan, planDef, org, teamUserIds } for a recruiter.
 * - Solo recruiter (no org): plan is their own `user.plan`, teamUserIds is just themselves.
 * - Org member: plan is always the ORG OWNER's plan (single source of billing truth),
 *   teamUserIds is every accepted member, so jobs/applicants are visible across the team.
 */
export async function resolveTeamScope(user) {
  if (!user.organization) {
    return {
      plan: user.plan,
      planDef: PLANS[user.plan] || PLANS.free,
      org: null,
      teamUserIds: [user._id],
    };
  }

  const org = await Organization.findById(user.organization);
  if (!org) {
    // Dangling reference (org deleted) — fail safe to solo scope on the user's own plan.
    return { plan: user.plan, planDef: PLANS[user.plan] || PLANS.free, org: null, teamUserIds: [user._id] };
  }

  const owner = await User.findById(org.owner).select('plan');
  const plan = owner?.plan || 'free';

  return {
    plan,
    planDef: PLANS[plan] || PLANS.free,
    org,
    teamUserIds: org.memberUserIds(),
  };
}
