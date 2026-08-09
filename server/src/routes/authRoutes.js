import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { registerSchema, loginSchema, updateAccountProfileSchema, changePasswordSchema } from '../validators/authSchemas.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);
router.patch('/company-profile', requireAuth, requireRole('recruiter'), authController.updateCompanyProfile);
router.patch('/profile', requireAuth, validate({ body: updateAccountProfileSchema }), authController.updateAccountProfile);
router.patch('/password', requireAuth, authLimiter, validate({ body: changePasswordSchema }), authController.changePassword);

export default router;
