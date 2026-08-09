import { Router } from 'express';
import { z } from 'zod';
import * as billingController from '../controllers/billingController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRecruiter } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { paymentLimiter } from '../middleware/rateLimit.js';
import { requireIdempotencyKey } from '../middleware/idempotency.js';

const router = Router();

const checkoutSchema = z.object({
  planId: z.enum(['growth', 'scale']),
  interval: z.enum(['monthly', 'annual']),
});

const verifySchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_subscription_id: z.string(),
  razorpay_signature: z.string(),
});

router.get('/plans', billingController.getPlans);
router.get('/config', billingController.getBillingConfig);

router.get('/me', requireAuth, requireRecruiter, billingController.getMySubscription);
router.get('/audit-log', requireAuth, requireRecruiter, billingController.billingAuditLog);

router.post(
  '/checkout',
  requireAuth,
  requireRecruiter,
  paymentLimiter,
  validate({ body: checkoutSchema }),
  requireIdempotencyKey('billing.checkout'),
  billingController.startCheckout
);

router.post(
  '/verify',
  requireAuth,
  requireRecruiter,
  paymentLimiter,
  validate({ body: verifySchema }),
  billingController.verifyCheckout
);

router.post(
  '/cancel',
  requireAuth,
  requireRecruiter,
  paymentLimiter,
  billingController.cancelMySubscription
);

// NOTE: webhook route is mounted separately in app.js with express.raw()
// (Razorpay signature verification needs the untouched raw body).

export default router;
