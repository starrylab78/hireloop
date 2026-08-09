import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Hero } from '@/components/marketing/Hero';
import { PricingTable } from '@/components/marketing/PricingTable';
import { useAuth } from '@/context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const FEATURES = [
  { label: 'For recruiters', title: 'One pipeline, not six spreadsheets', body: 'Move every applicant through applied, screened, interviewed, and hired — with a kanban board built for the loop, not a generic ticket tracker.' },
  { label: 'For candidates', title: 'A feed that shows its work', body: 'Every listing carries a match score against your resume, so you know before you click whether it is worth your time.' },
  { label: 'For both sides', title: 'Billing that stays out of the way', body: 'Recruiters pick a plan, candidates never see a paywall. Feature limits are enforced server-side, so nothing you cannot afford ever half-loads.' },
];

export function LandingPage() {
  const { user } = useAuth();
  const finalCta = !user
    ? { to: '/register', label: 'Get started' }
    : user.role === 'recruiter'
    ? { to: '/dashboard', label: 'Go to your dashboard' }
    : { to: '/jobs', label: 'Browse open roles' };

  return (
    <div>
      <Hero />

      <section className="border-t border-border bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp} className="eyebrow mb-4">
            Built around the loop
          </motion.p>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="show" viewport={{ once: true }}
                variants={fadeUp} transition={{ delay: i * 0.1 }}
              >
                <span className="stage-tag text-loop">{f.label}</span>
                <h3 className="mt-3 font-serif text-2xl leading-snug">{f.title}</h3>
                <p className="mt-3 text-ink-soft">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="eyebrow mb-4">Pricing</p>
            <h2 className="font-serif text-4xl">Pick a plan, start posting today</h2>
          </div>
          <PricingTable />
        </div>
      </section>

      <section className="border-t border-border bg-ink py-20 text-paper">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">Ready to close your first loop?</h2>
          <p className="mt-4 text-paper/70">Post a role for free — upgrade only once you need the pipeline.</p>
          <Link to={finalCta.to} className="btn-primary mt-8 inline-flex bg-loop hover:bg-loop-light">
            {finalCta.label}
          </Link>
        </div>
      </section>
    </div>
  );
}
