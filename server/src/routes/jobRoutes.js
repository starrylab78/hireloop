import { Router } from 'express';
import * as jobController from '../controllers/jobController.js';
import { requireAuth, attachUserIfPresent } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';
import { attachTeamScope, enforceActiveJobLimit, requirePlanFeature } from '../middleware/planGate.js';
import { validate } from '../middleware/validate.js';
import { createJobSchema, updateJobSchema, jobQuerySchema } from '../validators/jobSchemas.js';

const router = Router();

// Public feed + detail (optional auth so we can show "saved" state for logged-in candidates)
router.get('/', attachUserIfPresent, validate({ query: jobQuerySchema }), jobController.listJobs);
router.get('/mine', requireAuth, requireRecruiter, attachTeamScope, jobController.listMyJobs);
router.get('/analytics/mine', requireAuth, requireRecruiter, attachTeamScope, requirePlanFeature('usageAnalytics'), jobController.jobAnalytics);
router.get('/analytics/funnel', requireAuth, requireRecruiter, attachTeamScope, jobController.pipelineFunnel);
router.post('/generate-description', requireAuth, requireRecruiter, jobController.generateDescription);
router.get('/:id', attachUserIfPresent, jobController.getJob);

router.post(
  '/',
  requireAuth,
  requireRecruiter,
  attachTeamScope,
  enforceActiveJobLimit,
  validate({ body: createJobSchema }),
  jobController.createJob
);

router.patch(
  '/:id',
  requireAuth,
  requireRecruiter,
  attachTeamScope,
  validate({ body: updateJobSchema }),
  jobController.updateJob
);

router.delete('/:id', requireAuth, requireRecruiter, attachTeamScope, jobController.deleteJob);

export default router;
