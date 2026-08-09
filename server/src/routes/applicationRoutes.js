import { Router } from 'express';
import * as applicationController from '../controllers/applicationController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCandidate, requireRecruiter } from '../middleware/roles.js';
import { attachTeamScope, requirePlanFeature } from '../middleware/planGate.js';
import { validate } from '../middleware/validate.js';
import { stageUpdateSchema, scheduleInterviewSchema } from '../validators/jobSchemas.js';
import { uploadResume, parseUploadedResume } from '../middleware/upload.js';

const router = Router();

// Candidate
router.post(
  '/jobs/:jobId/apply',
  requireAuth,
  requireCandidate,
  uploadResume,
  parseUploadedResume,
  applicationController.applyToJob
);
router.get('/mine', requireAuth, requireCandidate, applicationController.myApplications);

// Recruiter (team-scoped) — applicant filtering by stage/score is plan-gated
router.get(
  '/jobs/:jobId/applicants',
  requireAuth,
  requireRecruiter,
  attachTeamScope,
  (req, res, next) => {
    if (req.query.stage || req.query.minMatch) {
      return requirePlanFeature('applicantFiltering')(req, res, next);
    }
    next();
  },
  applicationController.listApplicants
);

router.patch(
  '/:id/stage',
  requireAuth,
  requireRecruiter,
  attachTeamScope,
  requirePlanFeature('atsPipeline'),
  validate({ body: stageUpdateSchema }),
  applicationController.updateApplicationStage
);

router.post(
  '/:id/schedule-interview',
  requireAuth,
  requireRecruiter,
  attachTeamScope,
  requirePlanFeature('atsPipeline'),
  validate({ body: scheduleInterviewSchema }),
  applicationController.scheduleInterview
);

router.get(
  '/jobs/:jobId/export',
  requireAuth,
  requireRecruiter,
  attachTeamScope,
  requirePlanFeature('csvExport'),
  applicationController.exportApplicantsCsv
);

export default router;
