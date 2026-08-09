import {
  createSubscription,
  verifyCheckoutSignature,
  cancelSubscription,
  handleRazorpayWebhook,
} from '../services/razorpayService.js';
import Subscription from '../models/Subscription.js';
import AuditLog from '../models/AuditLog.js';
import { PLANS } from '../config/plans.js';

export async function getPlans(_req, res) {
  res.json({ plans: Object.values(PLANS) });
}

/** Public Razorpay key (safe to expose client-side — it's the publishable half of the key pair, needed to open the Checkout.js modal). */
export async function getBillingConfig(_req, res) {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID || null });
}

export async function getMySubscription(req, res, next) {
  try {
    const sub = await Subscription.findOne({ recruiter: req.user._id });
    res.json({ plan: req.user.plan, subscription: sub || null });
  } catch (err) {
    next(err);
  }
}

/** Creates a Razorpay subscription for the frontend to open in the Checkout.js modal. */
export async function startCheckout(req, res, next) {
  try {
    const { planId, interval } = req.body; // validated via zod in the route
    const subscription = await createSubscription({ user: req.user, planId, interval });

    await AuditLog.create({
      actor: req.user._id,
      actorLabel: `user:${req.user._id}`,
      action: 'subscription.created',
      targetType: 'User',
      targetId: req.user._id,
      metadata: { planId, interval, subscriptionId: subscription.id },
      ip: req.ip,
    });

    res.json({ subscriptionId: subscription.id });
  } catch (err) {
    next(err);
  }
}

/**
 * Called by the frontend right after Razorpay's Checkout.js modal reports success.
 * This is a fast, client-confirmed check purely for immediate UI feedback —
 * the webhook is what actually grants the plan, since it's the only path
 * guaranteed to fire even if the user closes the tab immediately after paying.
 */
export async function verifyCheckout(req, res, next) {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
    const valid = verifyCheckoutSignature({ razorpay_payment_id, razorpay_subscription_id, razorpay_signature });
    if (!valid) {
      return res.status(400).json({ error: 'Payment could not be verified', code: 'SIGNATURE_INVALID' });
    }
    res.json({ verified: true });
  } catch (err) {
    next(err);
  }
}

/** Self-serve cancellation — Razorpay has no hosted billing-portal equivalent to Stripe's, so this calls the API directly. */
export async function cancelMySubscription(req, res, next) {
  try {
    const sub = await Subscription.findOne({ recruiter: req.user._id });
    if (!sub?.razorpaySubscriptionId) {
      return res.status(404).json({ error: 'No active subscription to cancel', code: 'NO_SUBSCRIPTION' });
    }

    await cancelSubscription(sub.razorpaySubscriptionId, { atCycleEnd: true });
    sub.cancelAtCycleEnd = true;
    await sub.save();

    await AuditLog.create({
      actor: req.user._id,
      actorLabel: `user:${req.user._id}`,
      action: 'subscription.cancel_requested',
      targetType: 'Subscription',
      targetId: req.user._id,
      metadata: { subscriptionId: sub.razorpaySubscriptionId },
      ip: req.ip,
    });

    res.json({ ok: true, cancelAtCycleEnd: true });
  } catch (err) {
    next(err);
  }
}

/** Raw-body route — signature verified with an HMAC check against RAZORPAY_WEBHOOK_SECRET, never trust unsigned payloads. */
export async function razorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  try {
    const result = await handleRazorpayWebhook(req.body, signature);
    res.json(result);
  } catch (err) {
    console.error('[razorpay webhook] verification failed', err.message);
    res.status(400).json({ error: 'Webhook signature verification failed', code: 'INVALID_SIGNATURE' });
  }
}

export async function billingAuditLog(req, res, next) {
  try {
    const logs = await AuditLog.find({ targetId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
}
