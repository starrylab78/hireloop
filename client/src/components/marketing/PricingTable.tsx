import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

type Interval = 'monthly' | 'annual';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Try the loop',
    monthly: 0,
    annual: 0,
    features: ['1 active job post', 'Public job feed listing', 'Email applicant alerts'],
    cta: 'Start free',
    highlighted: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    tagline: 'For active hiring teams',
    monthly: 999,
    annual: 999 * 10,
    features: ['10 active job posts', 'ATS pipeline (kanban)', 'Applicant filtering', 'CSV export', 'Usage analytics'],
    cta: 'Start Growth',
    highlighted: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    tagline: 'For hiring at volume',
    monthly: 2999,
    annual: 2999 * 10,
    features: ['Unlimited job posts', 'Everything in Growth', 'Priority listing placement', '5 team seats'],
    cta: 'Start Scale',
    highlighted: false,
  },
] as const;

export function PricingTable() {
  const [interval, setInterval] = useState<Interval>('monthly');

  return (
    <div>
      <div className="mx-auto mb-12 flex w-fit items-center gap-1 rounded-full border border-border bg-white p-1">
        {(['monthly', 'annual'] as Interval[]).map((i) => (
          <button
            key={i}
            onClick={() => setInterval(i)}
            className={`relative rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              interval === i ? 'text-paper' : 'text-ink-soft'
            }`}
          >
            {interval === i && (
              <motion.span layoutId="pricing-toggle" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', duration: 0.4 }} />
            )}
            <span className="relative z-10 capitalize">{i} {i === 'annual' && '· 2 months free'}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div
            key={tier.id}
            className={`card flex flex-col p-8 ${tier.highlighted ? 'border-loop ring-1 ring-loop' : ''}`}
          >
            {tier.highlighted && <span className="eyebrow mb-4 w-fit rounded-full bg-loop-tint px-3 py-1">Most popular</span>}
            <h3 className="font-serif text-2xl">{tier.name}</h3>
            <p className="mt-1 text-sm text-ink-muted">{tier.tagline}</p>

            <div className="mt-6 flex items-baseline gap-1">
              <span className="font-mono text-xs text-ink-muted">₹</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${tier.id}-${interval}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="font-serif text-4xl"
                >
                  {(interval === 'monthly' ? tier.monthly : Math.round(tier.annual / 12)).toLocaleString('en-IN')}
                </motion.span>
              </AnimatePresence>
              <span className="text-sm text-ink-muted">/mo</span>
            </div>
            {interval === 'annual' && tier.annual > 0 && (
              <p className="mt-1 text-xs text-ink-muted">₹{tier.annual.toLocaleString('en-IN')} billed annually</p>
            )}

            <ul className="mt-7 flex-1 space-y-3 text-sm">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-ink-soft">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-loop" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to="/register"
              className={`mt-8 w-full text-center ${tier.highlighted ? 'btn-primary' : 'btn-secondary'}`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
