import { Router } from 'express';
import * as oauthController from '../controllers/oauthController.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/google', authLimiter, oauthController.startGoogle);
router.get('/google/callback', authLimiter, oauthController.googleCallback);

router.get('/linkedin', authLimiter, oauthController.startLinkedIn);
router.get('/linkedin/callback', authLimiter, oauthController.linkedinCallback);

export default router;
