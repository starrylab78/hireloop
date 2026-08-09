import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { FilterBar, JobFilters } from '@/components/candidate/FilterBar';
import { JobCard } from '@/components/candidate/JobCard';
import type { Job } from '@/types';

const EMPTY_FILTERS: JobFilters = { q: '', location: '', workMode: '', experienceLevel: '', salaryMin: '' };

// Lightweight client-side echo of the server's keyword-overlap match score,
// used only for instant feedback in the feed; the authoritative score is
// computed server-side at application time against the candidate's stored resume text.
function quickMatchScore(resumeText: string, jobText: string): number {
  const tokenize = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9+.\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2));
  const resumeTokens = tokenize(resumeText || '');
  const jobTokens = tokenize(jobText || '');
  if (jobTokens.size === 0) return 0;
  let overlap = 0;
  jobTokens.forEach((t) => { if (resumeTokens.has(t)) overlap += 1; });
  return Math.round((overlap / jobTokens.size) * 100);
}

export function JobFeedPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<JobFilters>(EMPTY_FILTERS);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const resumeText = user?.candidateProfile?.resumeText || '';
  const resumeSkills = (user?.candidateProfile?.skills || []).join(' ');

  const fetchJobs = useCallback(async (f: JobFilters) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (f.q) params.q = f.q;
      if (f.location) params.location = f.location;
      if (f.workMode) params.workMode = f.workMode;
      if (f.experienceLevel) params.experienceLevel = f.experienceLevel;
      if (f.salaryMin) params.salaryMin = f.salaryMin;
      const { data } = await api.get('/jobs', { params });
      setJobs(data.jobs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(filters); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function toggleSave(jobId: string) {
    if (!user) return;
    const { data } = await api.post(`/candidate/saved-jobs/${jobId}`);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (data.saved) next.add(jobId); else next.delete(jobId);
      return next;
    });
  }

  async function saveSearch() {
    const name = window.prompt('Name this saved search (e.g. "Remote React roles")');
    if (!name) return;
    await api.post('/candidate/saved-searches', { name, query: filters });
    window.alert('Saved. Find it on your dashboard.');
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <p className="eyebrow mb-3">Job feed</p>
        <h1 className="font-serif text-4xl">Find your next role</h1>
        {resumeText && <p className="mt-2 text-sm text-ink-muted">Match scores below are estimated against your uploaded resume.</p>}
      </div>

      <FilterBar filters={filters} onChange={(f) => { setFilters(f); fetchJobs(f); }} onSaveSearch={user ? saveSearch : undefined} />

      {loading ? (
        <p className="mt-12 text-center text-ink-muted">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="mt-12 text-center text-ink-muted">No roles match those filters yet — try widening your search.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              matchScore={resumeText ? quickMatchScore(`${resumeText} ${resumeSkills}`, job.descriptionText) : undefined}
              onSwipeSave={user?.role === 'candidate' ? () => toggleSave(job._id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
