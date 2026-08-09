import { Router } from 'express';
import { z } from 'zod';
import * as orgController from '../controllers/organizationController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const inviteSchema = z.object({ email: z.string().trim().email() });

router.get('/mine', requireAuth, requireRecruiter, orgController.getMyOrganization);
router.post('/invite', requireAuth, requireRecruiter, validate({ body: inviteSchema }), orgController.inviteTeammate);
router.post('/invite/:token/accept', requireAuth, orgController.acceptInvite); // candidate or recruiter can accept -> becomes recruiter
router.delete('/members/:userId', requireAuth, requireRecruiter, orgController.removeTeammate);

export default router;
