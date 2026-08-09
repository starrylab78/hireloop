import { Router } from 'express';
import * as candidateController from '../controllers/candidateController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCandidate } from '../middleware/roles.js';
import { uploadResume, parseUploadedResume } from '../middleware/upload.js';

const router = Router();

router.use(requireAuth, requireCandidate);

router.post('/resume', uploadResume, parseUploadedResume, candidateController.uploadResumeAndAutofill);
router.patch('/profile', candidateController.updateCandidateProfile);

router.post('/saved-searches', candidateController.saveSearch);
router.delete('/saved-searches/:searchId', candidateController.deleteSavedSearch);

router.post('/saved-jobs/:jobId', candidateController.toggleSaveJob);
router.get('/saved-jobs', candidateController.listSavedJobs);

export default router;
