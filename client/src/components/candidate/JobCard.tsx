import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Bookmark } from 'lucide-react';
import type { Job } from '@/types';

function matchColor(score: number) {
  if (score >= 70) return 'text-loop bg-loop-tint';
  if (score >= 40) return 'text-gold-dark bg-gold/10';
  return 'text-ink-muted bg-border/40';
}

export function JobCard({ job, matchScore, onSwipeSave }: { job: Job; matchScore?: number; onSwipeSave?: () => void }) {
  const x = useMotionValue(0);
  const background = useTransform(x, [-120, 0, 120], ['rgba(232,177,77,0.15)', 'rgba(255,255,255,0)', 'rgba(31,95,79,0.12)']);
  const salary =
    job.salaryMin && job.salaryMax
      ? `₹${(job.salaryMin / 100000).toFixed(0)}–${(job.salaryMax / 100000).toFixed(0)} LPA`
      : 'Compensation not disclosed';

  return (
    <motion.div
      style={{ x, background }}
      drag={onSwipeSave ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) onSwipeSave?.();
      }}
      className="card relative flex flex-col gap-3 p-6 md:cursor-default"
    >
      {job.priorityListing && (
        <span className="stage-tag absolute right-6 top-6 rounded-full bg-gold/15 px-2.5 py-1 text-gold-dark">Featured</span>
      )}
      <div>
        <p className="text-xs text-ink-muted">{job.companyName}</p>
        <Link to={`/jobs/${job._id}`} className="font-serif text-xl leading-snug hover:text-loop">
          {job.title}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location || 'Location TBD'}</span>
        <span className="flex items-center gap-1 capitalize"><Briefcase className="h-3.5 w-3.5" />{job.workMode}</span>
        <span>{salary}</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {job.skills.slice(0, 4).map((s) => (
          <span key={s} className="rounded-full bg-paper px-2.5 py-1 text-xs text-ink-soft border border-border">{s}</span>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        {typeof matchScore === 'number' ? (
          <span className={`stage-tag rounded-full px-2.5 py-1 ${matchColor(matchScore)}`}>{matchScore}% match</span>
        ) : (
          <span />
        )}
        <button onClick={onSwipeSave} className="text-ink-muted hover:text-loop" aria-label="Save job">
          <Bookmark className="h-4.5 w-4.5" />
        </button>
      </div>
    </motion.div>
  );
}
