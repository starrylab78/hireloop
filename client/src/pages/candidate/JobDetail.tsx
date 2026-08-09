import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Job } from '@/types';

interface SimilarEntry { job: Pick<Job, '_id' | 'title' | 'companyName' | 'location' | 'workMode'>; score: number }

export function JobDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [similar, setSimilar] = useState<SimilarEntry[]>([]);
  const [applyState, setApplyState] = useState<'idle' | 'applying' | 'applied' | 'error'>('idle');
  const [coverNote, setCoverNote] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/jobs/${id}`).then(({ data }) => { setJob(data.job); setSimilar(data.similar); });
  }, [id]);

  async function submitApplication() {
    if (!job) return;
    setApplyState('applying');
    setError('');
    try {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      formData.append('coverNote', coverNote);
      await api.post(`/applications/jobs/${job._id}/apply`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setApplyState('applied');
    } catch (err: any) {
      setApplyState('error');
      setError(err?.response?.data?.error || 'Could not submit your application.');
    }
  }

  if (!job) return <div className="mx-auto max-w-3xl px-6 py-16 text-ink-muted">Loading…</div>;

  const salary = job.salaryMin && job.salaryMax ? `₹${(job.salaryMin / 100000).toFixed(0)}–${(job.salaryMax / 100000).toFixed(0)} LPA` : 'Compensation not disclosed';

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-14 md:grid-cols-[2fr_1fr]">
      <div>
        <p className="text-sm text-ink-muted">{job.companyName}</p>
        <h1 className="mt-1 font-serif text-4xl leading-tight">{job.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-soft">
          <span className="rounded-full border border-border px-3 py-1 capitalize">{job.workMode}</span>
          <span className="rounded-full border border-border px-3 py-1 capitalize">{job.experienceLevel}</span>
          <span className="rounded-full border border-border px-3 py-1">{salary}</span>
          {job.location && <span className="rounded-full border border-border px-3 py-1">{job.location}</span>}
        </div>

        <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-serif" dangerouslySetInnerHTML={{ __html: job.descriptionHtml }} />

        {user?.role === 'candidate' && (
          <div className="card mt-10 p-6">
            <h3 className="font-serif text-xl">Apply to this role</h3>
            {applyState === 'applied' ? (
              <p className="mt-3 text-loop">You're in! Track this application from your dashboard.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm text-ink-soft">Resume (PDF or .txt)</label>
                  <input type="file" accept=".pdf,.txt" onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="w-full text-sm" />
                  {!resumeFile && user.candidateProfile?.resumeUrl && (
                    <p className="mt-1 text-xs text-ink-muted">We'll use your saved resume if you don't upload a new one.</p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-ink-soft">Cover note (optional)</label>
                  <textarea value={coverNote} onChange={(e) => setCoverNote(e.target.value)} rows={3}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-loop" />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button onClick={submitApplication} disabled={applyState === 'applying'} className="btn-primary">
                  {applyState === 'applying' ? 'Submitting…' : 'One-click apply'}
                </button>
              </div>
            )}
          </div>
        )}
        {!user && (
          <div className="card mt-10 p-6 text-center">
            <p className="text-ink-soft"><Link to="/login" className="text-loop hover:underline">Log in</Link> as a candidate to apply.</p>
          </div>
        )}
      </div>

      <aside>
        <h3 className="eyebrow mb-4">Similar jobs</h3>
        <div className="space-y-3">
          {similar.length === 0 && <p className="text-sm text-ink-muted">No close matches yet.</p>}
          {similar.map(({ job: s, score }) => (
            <Link key={s._id} to={`/jobs/${s._id}`} className="card block p-4 hover:border-loop">
              <p className="text-sm font-medium">{s.title}</p>
              <p className="text-xs text-ink-muted">{s.companyName} · {s.location}</p>
              <p className="mt-1 stage-tag text-loop">{Math.round(score * 100)}% similar</p>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
