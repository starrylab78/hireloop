import { Router } from 'express';
import { z } from 'zod';
import * as talentPoolController from '../controllers/talentPoolController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth, requireRecruiter);

const saveSchema = z.object({
  candidateId: z.string().min(1),
  applicationId: z.string().optional(),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string().trim().max(30)).max(20).optional(),
});
const recontactSchema = z.object({ message: z.string().trim().min(1).max(3000) });

router.get('/', talentPoolController.listTalentPool);
router.post('/', validate({ body: saveSchema }), talentPoolController.saveToTalentPool);
router.delete('/:id', talentPoolController.removeFromTalentPool);
router.post('/:id/recontact', validate({ body: recontactSchema }), talentPoolController.recontactCandidate);

export default router;
