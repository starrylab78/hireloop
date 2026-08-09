import Job from '../models/Job.js';
import { resolveTeamScope } from '../services/teamScope.js';

/**
 * attachTeamScope — resolves req.teamScope = { plan, planDef, org, teamUserIds } once per
 * request, so downstream gates and controllers don't each re-query the org/owner.
 * Mount this before any middleware/controller that needs plan or team-scoped queries.
 */
export async function attachTeamScope(req, res, next) {
  try {
    req.teamScope = await resolveTeamScope(req.user);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * requirePlanFeature('atsPipeline') — blocks the request unless the recruiter's CURRENT
 * effective plan (their own, or their org owner's if they're a team member — never trust
 * the frontend or the JWT) has that boolean feature enabled.
 */
export function requirePlanFeature(featureKey) {
  return function planFeatureGate(req, res, next) {
    const planDef = req.teamScope?.planDef;
    if (!planDef) {
      return next(new Error('requirePlanFeature used without attachTeamScope running first'));
    }
    if (!planDef[featureKey]) {
      return res.status(402).json({
        error: `Your current plan (${planDef.name}) does not include this feature. Upgrade to unlock it.`,
        code: 'PLAN_FEATURE_LOCKED',
        feature: featureKey,
        currentPlan: planDef.id,
      });
    }
    next();
  };
}

/**
 * enforceActiveJobLimit — checked before creating a new job post.
 * Counts ACTIVE jobs across the whole team (not just this one user), against the team's plan cap.
 */
export async function enforceActiveJobLimit(req, res, next) {
  try {
    const { planDef, teamUserIds } = req.teamScope;
    const activeCount = await Job.countDocuments({ recruiter: { $in: teamUserIds }, status: 'active' });

    if (activeCount >= planDef.maxActiveJobs) {
      return res.status(402).json({
        error: `Your ${planDef.name} plan allows up to ${planDef.maxActiveJobs === Infinity ? 'unlimited' : planDef.maxActiveJobs} active job post(s). You have ${activeCount}. Upgrade or close an existing post to publish a new one.`,
        code: 'PLAN_JOB_LIMIT_REACHED',
        currentPlan: planDef.id,
        limit: planDef.maxActiveJobs,
        activeCount,
      });
    }
    next();
  } catch (err) {
    next(err);
  }
}
