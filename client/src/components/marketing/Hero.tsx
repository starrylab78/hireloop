import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero() {
  const { user } = useAuth();

  const primaryCta = !user
    ? { to: '/register', label: 'Post your first job — free' }
    : user.role === 'recruiter'
    ? { to: '/dashboard', label: 'Go to your dashboard' }
    : { to: '/candidate', label: 'View your applications' };

  const secondaryCta = !user
    ? { to: '/jobs', label: 'Browse open roles' }
    : user.role === 'recruiter'
    ? { to: '/dashboard/post-job', label: 'Post a new job' }
    : { to: '/jobs', label: 'Browse open roles' };

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 pb-20 pt-16 md:grid-cols-2 md:pt-24">
        <div>
          <motion.p initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} variants={fadeUp} className="eyebrow mb-5">
            {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Hiring, in the loop'}
          </motion.p>
          <motion.h1
            initial="hidden" whileInView="show" viewport={{ once: true }} custom={1} variants={fadeUp}
            className="text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl"
          >
            Post a role.<br />Close the loop.
          </motion.h1>
          <motion.p
            initial="hidden" whileInView="show" viewport={{ once: true }} custom={2} variants={fadeUp}
            className="mt-6 max-w-md text-lg text-ink-soft"
          >
            HireLoop takes recruiters from an open req to a signed offer with one pipeline —
            and gives candidates a feed worth checking back to.
          </motion.p>
          <motion.div
            initial="hidden" whileInView="show" viewport={{ once: true }} custom={3} variants={fadeUp}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link to={primaryCta.to} className="btn-primary">{primaryCta.label}</Link>
            <Link to={secondaryCta.to} className="btn-secondary">{secondaryCta.label}</Link>
          </motion.div>
          {!user && (
            <motion.div
              initial="hidden" whileInView="show" viewport={{ once: true }} custom={4} variants={fadeUp}
              className="mt-10 flex items-center gap-6 text-xs text-ink-muted font-mono"
            >
              <span>1 free post, always</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>No card required to start</span>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <LoopDiagram />
        </motion.div>
      </div>
    </section>
  );
}

/** Signature element: the two interlocking loops of the mark, expanded into the
 *  candidate <-> recruiter hiring cycle, with stage labels animating in sequence. */
function LoopDiagram() {
  const stages = ['Applied', 'Screened', 'Interviewed', 'Hired'];
  return (
    <div className="card relative aspect-square w-full max-w-md mx-auto p-8 md:p-10">
      <svg viewBox="0 0 300 300" className="h-full w-full text-loop">
        <motion.path
          d="M110 220C55 220 15 180 15 130S55 40 110 40c50 0 90 28 105 70"
          fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />
        <motion.path
          d="M190 90c55 0 95 40 95 90s-40 90-95 90c-50 0-90-28-105-70"
          fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-gold-dark"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ duration: 1.4, delay: 0.3, ease: 'easeInOut' }}
        />
        <motion.circle cx="15" cy="130" r="6" fill="currentColor"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.2 }} />
        <motion.circle cx="285" cy="180" r="6" fill="currentColor" className="text-gold-dark"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1.5 }} />
      </svg>
      <div className="absolute inset-x-8 bottom-8 space-y-2">
        {stages.map((s, i) => (
          <motion.div
            key={s}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 1.6 + i * 0.15 }}
            className="flex items-center gap-3"
          >
            <span className="stage-tag text-ink-muted">{String(i + 1).padStart(2, '0')}</span>
            <span className="h-px flex-1 bg-border" />
            <span className="text-sm text-ink-soft">{s}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
