import { useEffect, useState } from 'react';
import { api, newIdempotencyKey } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useAuth } from '@/context/AuthContext';
import type { PlanDefinition } from '@/types';
import { RecruiterSubNav } from '@/components/recruiter/RecruiterSubNav';

interface SubscriptionInfo {
  status: string;
  currentPeriodEnd?: string;
  cancelAtCycleEnd?: boolean;
}

export function BillingPage() {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [keyId, setKeyId] = useState<string | null>(null);
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get('/billing/plans').then(({ data }) => setPlans(data.plans));
    api.get('/billing/config').then(({ data }) => setKeyId(data.keyId));
    loadSubscription();
  }, []);

  async function loadSubscription() {
    const { data } = await api.get('/billing/me');
    setSubscription(data.subscription);
  }

  /** Polls briefly after a successful payment, since plan activation happens via webhook, not synchronously. */
  async function pollForPlanUpdate(planId: string, attempts = 8) {
    for (let i = 0; i < attempts; i++) {
      await new Promise((r) => window.setTimeout(r, 2000));
      await refreshUser();
      const { data } = await api.get('/auth/me');
      if (data.user.plan === planId) {
        await loadSubscription();
        return true;
      }
    }
    return false;
  }

  async function checkout(plan: PlanDefinition) {
    if (!keyId) {
      setMessage({ type: 'error', text: 'Payments aren\u2019t configured on this server yet (missing RAZORPAY_KEY_ID).' });
      return;
    }
    setLoadingPlan(plan.id);
    setMessage(null);
    try {
      const { data } = await api.post(
        '/billing/checkout',
        { planId: plan.id, interval },
        { headers: { 'Idempotency-Key': newIdempotencyKey() } }
      );

      const result = await openRazorpayCheckout({
        keyId,
        subscriptionId: data.subscriptionId,
        name: 'HireLoop',
        description: `${plan.name} plan (${interval})`,
        prefillName: user?.name || '',
        prefillEmail: user?.email || '',
      });

      await api.post('/billing/verify', result);
      setMessage({ type: 'ok', text: 'Payment received \u2014 activating your plan\u2026' });

      const activated = await pollForPlanUpdate(plan.id);
      setMessage(
        activated
          ? { type: 'ok', text: `You're now on the ${plan.name} plan.` }
          : { type: 'ok', text: 'Payment received. Your plan is still activating \u2014 refresh this page in a moment if it doesn\u2019t update automatically.' }
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || err?.response?.data?.error || 'Checkout did not complete.' });
    } finally {
      setLoadingPlan(null);
    }
  }

  async function cancelSubscription() {
    if (!window.confirm('Cancel your subscription? You\u2019ll keep access until the end of your current billing cycle.')) return;
    setCancelling(true);
    setMessage(null);
    try {
      await api.post('/billing/cancel');
      await loadSubscription();
      setMessage({ type: 'ok', text: 'Your subscription will end at the close of the current billing cycle.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.error || 'Could not cancel your subscription.' });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <RecruiterSubNav />
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="eyebrow mb-3">Billing</p>
        <h1 className="font-serif text-4xl">Manage your plan</h1>
        <p className="mt-2 text-ink-soft">
          Current plan: <span className="font-medium capitalize text-ink">{user?.plan}</span>
          {subscription?.cancelAtCycleEnd && (
            <span className="ml-2 text-xs text-gold-dark">(cancels at end of current cycle)</span>
          )}
        </p>

        {user?.plan !== 'free' && (
          <button onClick={cancelSubscription} disabled={cancelling || subscription?.cancelAtCycleEnd} className="btn-secondary mt-6">
            {cancelling ? 'Cancelling\u2026' : subscription?.cancelAtCycleEnd ? 'Cancellation scheduled' : 'Cancel subscription'}
          </button>
        )}

        {message && (
          <p className={`mt-4 rounded-md px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-loop-tint text-loop-dark' : 'bg-red-50 text-red-600'}`}>
            {message.text}
          </p>
        )}

        <div className="mt-10 flex w-fit rounded-full border border-border bg-white p-1">
          {(['monthly', 'annual'] as const).map((i) => (
            <button key={i} onClick={() => setInterval(i)}
              className={`rounded-full px-5 py-2 text-sm capitalize ${interval === i ? 'bg-ink text-paper' : 'text-ink-soft'}`}>
              {i}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === user?.plan;
            return (
              <div key={plan.id} className={`card relative p-6 ${isCurrent ? 'border-loop ring-1 ring-loop' : ''}`}>
                {isCurrent && (
                  <span className="stage-tag absolute right-4 top-4 rounded-full bg-loop-tint px-2.5 py-1 text-loop">Current plan</span>
                )}
                <h3 className="font-serif text-xl">{plan.name}</h3>
                <p className="mt-2 font-serif text-3xl">₹{(interval === 'monthly' ? plan.priceMonthlyINR : Math.round(plan.priceAnnualINR / 12)).toLocaleString('en-IN')}<span className="text-sm text-ink-muted">/mo</span></p>
                <ul className="mt-4 space-y-1 text-sm text-ink-soft">
                  <li>{plan.maxActiveJobs === null || plan.maxActiveJobs === Infinity ? 'Unlimited' : plan.maxActiveJobs} active posts</li>
                  <li>{plan.atsPipeline ? 'ATS pipeline included' : 'No pipeline'}</li>
                  <li>{plan.csvExport ? 'CSV export included' : 'No CSV export'}</li>
                </ul>
                {!isCurrent && plan.id !== 'free' && (
                  <button onClick={() => checkout(plan)} disabled={loadingPlan === plan.id} className="btn-primary mt-5 w-full">
                    {loadingPlan === plan.id ? 'Opening checkout\u2026' : `Switch to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-md border border-border bg-white p-4 text-xs text-ink-muted">
          Test mode: use card <span className="font-mono">4111 1111 1111 1111</span>, any future expiry, any CVC.
          For UPI, use the success VPA <span className="font-mono">success@razorpay</span>.
        </div>
      </div>
    </>
  );
}
