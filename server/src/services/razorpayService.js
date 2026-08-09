import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import AuditLog from '../models/AuditLog.js';
import WebhookEvent from '../models/WebhookEvent.js';
import { getRazorpayPlanId, planFromRazorpayPlanId } from '../config/plans.js';
import { sendSubscriptionReceiptEmail } from './emailService.js';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder',
});

// Razorpay subscriptions require a fixed number of billing cycles up front
// (`total_count`) rather than an open-ended "until cancelled" recurrence like
// Stripe. We use a large-but-finite count so it behaves as effectively
// unlimited; the recruiter can still cancel any time before it's reached.
const TOTAL_COUNT_BY_INTERVAL = { monthly: 120, annual: 10 }; // 10 years either way

/**
 * Creates a Razorpay subscription in `created` status and returns its id.
 * The frontend opens Razorpay's Checkout.js modal with this id to collect
 * payment; the subscription only becomes `active` after that completes,
 * confirmed authoritatively via webhook.
 */
export async function createSubscription({ user, planId, interval }) {
  const razorpayPlanId = getRazorpayPlanId(planId, interval);
  if (!razorpayPlanId) {
    const err = new Error(`No Razorpay plan configured for ${planId}/${interval}`);
    err.status = 400;
    err.code = 'PLAN_NOT_CONFIGURED';
    throw err;
  }

  const subscription = await razorpay.subscriptions.create({
    plan_id: razorpayPlanId,
    customer_notify: 1,
    total_count: TOTAL_COUNT_BY_INTERVAL[interval] || 120,
    // `notes` is how we correlate the webhook back to our own user record —
    // Razorpay echoes notes back on every subscription/payment webhook payload.
    notes: { userId: user._id.toString(), planId, interval },
  });

  return subscription; // { id, status: 'created', ... }
}

/**
 * Verifies the signature Razorpay's Checkout.js modal hands back on successful
 * payment. This is a fast client-side-confirmed check for immediate UI
 * feedback — the webhook remains the source of truth for actually granting
 * the plan (it fires even if the user closes the tab right after paying).
 */
export function verifyCheckoutSignature({ razorpay_payment_id, razorpay_subscription_id, razorpay_signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
    .digest('hex');
  return expected === razorpay_signature;
}

/** Cancels a recruiter's active subscription. Defaults to "at cycle end" so they keep access through what they already paid for. */
export async function cancelSubscription(subscriptionId, { atCycleEnd = true } = {}) {
  return razorpay.subscriptions.cancel(subscriptionId, atCycleEnd);
}

function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

/**
 * Verifies signature, then dispatches to a handler per event type.
 * Idempotent by a synthetic key (Razorpay doesn't provide one canonical
 * event id the way Stripe does across all webhook types, so we compose one
 * from event type + resource id + the payload's own timestamp — good enough
 * to dedupe retried deliveries in practice).
 */
export async function handleRazorpayWebhook(rawBody, signature) {
  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    const err = new Error('Webhook signature verification failed');
    err.status = 400;
    err.code = 'INVALID_SIGNATURE';
    throw err;
  }

  const body = JSON.parse(rawBody.toString('utf-8'));
  const entity = body.payload?.subscription?.entity || body.payload?.payment?.entity;
  const eventId = `${body.event}:${entity?.id || 'unknown'}:${body.created_at || Date.now()}`;

  const already = await WebhookEvent.findOne({ eventId });
  if (already) return { received: true, duplicate: true };
  await WebhookEvent.create({ eventId, type: body.event });

  switch (body.event) {
    case 'subscription.activated':
    case 'subscription.charged':
      await onSubscriptionActive(body.payload.subscription.entity, body.payload.payment?.entity);
      break;
    case 'subscription.cancelled':
    case 'subscription.completed':
    case 'subscription.halted':
      await onSubscriptionEnded(body.payload.subscription.entity, body.event);
      break;
    case 'payment.failed':
      await onPaymentFailed(body.payload.payment.entity);
      break;
    default:
      // Unhandled event types (paused/resumed/authenticated, etc.) are fine to ignore for now.
      break;
  }

  return { received: true };
}

async function resolveUserFromEntity(entity) {
  const userId = entity?.notes?.userId;
  if (!userId) return null;
  return User.findById(userId);
}

async function onSubscriptionActive(sub, payment) {
  const user = await resolveUserFromEntity(sub);
  if (!user) return;

  const planId = planFromRazorpayPlanId(sub.plan_id) || 'free';
  const previousPlan = user.plan;

  user.plan = planId;
  if (sub.customer_id) user.razorpayCustomerId = sub.customer_id;
  await user.save();

  await Subscription.findOneAndUpdate(
    { recruiter: user._id },
    {
      recruiter: user._id,
      razorpayCustomerId: sub.customer_id,
      razorpaySubscriptionId: sub.id,
      plan: planId,
      billingInterval: sub.notes?.interval || 'monthly',
      status: sub.status,
      currentPeriodEnd: sub.current_end ? new Date(sub.current_end * 1000) : undefined,
      cancelAtCycleEnd: false,
    },
    { upsert: true }
  );

  await AuditLog.create({
    actorLabel: 'razorpay-webhook',
    action: 'subscription.activated',
    targetType: 'Subscription',
    targetId: user._id,
    metadata: { previousPlan, newPlan: planId, status: sub.status, subscriptionId: sub.id },
  });

  if (payment) {
    sendSubscriptionReceiptEmail(user, payment).catch((e) => console.error('[email] receipt failed', e));
  }
}

async function onSubscriptionEnded(sub, eventType) {
  const user = await resolveUserFromEntity(sub);
  if (!user) return;

  const previousPlan = user.plan;
  user.plan = 'free';
  await user.save();

  await Subscription.findOneAndUpdate(
    { recruiter: user._id },
    { status: sub.status, plan: 'free' },
    { upsert: true }
  );

  await AuditLog.create({
    actorLabel: 'razorpay-webhook',
    action: `subscription.${eventType.split('.')[1]}`,
    targetType: 'Subscription',
    targetId: user._id,
    metadata: { previousPlan, subscriptionId: sub.id },
  });
}

async function onPaymentFailed(payment) {
  const user = await resolveUserFromEntity(payment);
  if (!user) return;
  await AuditLog.create({
    actorLabel: 'razorpay-webhook',
    action: 'payment.failed',
    targetType: 'User',
    targetId: user._id,
    metadata: { paymentId: payment.id, amount: payment.amount, errorReason: payment.error_reason },
  });
}
