import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Application, PipelineStage } from '@/types';

const STAGE_LABEL: Record<PipelineStage, string> = {
  applied: 'Applied', screened: 'Screening', interviewed: 'Interview', offered: 'Offer', hired: 'Hired', rejected: 'Not moving forward',
};
const STAGE_COLOR: Record<PipelineStage, string> = {
  applied: 'bg-border/50 text-ink-soft', screened: 'bg-loop-tint text-loop', interviewed: 'bg-gold/15 text-gold-dark',
  offered: 'bg-loop/15 text-loop-dark', hired: 'bg-loop text-paper', rejected: 'bg-red-50 text-red-600',
};

export function CandidateDashboard() {
  const { user, refreshUser } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get('/applications/mine').then(({ data }) => setApplications(data.applications));
  }, []);

  async function onResumeUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      await api.post('/candidate/resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="eyebrow mb-3">Your dashboard</p>
      <h1 className="font-serif text-4xl">Hi {user?.name.split(' ')[0]}</h1>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.4fr]">
        <div className="card p-6">
          <h3 className="font-serif text-xl">Your profile</h3>
          <p className="mt-1 text-sm text-ink-muted">{user?.candidateProfile?.headline || 'Add a headline to stand out.'}</p>

          <div className="mt-5">
            <label className="mb-2 block text-sm text-ink-soft">Resume</label>
            <input
              type="file" accept=".pdf,.txt" disabled={uploading}
              onChange={(e) => e.target.files?.[0] && onResumeUpload(e.target.files[0])}
              className="w-full text-sm"
            />
            {user?.candidateProfile?.resumeUrl && (
              <p className="mt-2 text-xs text-loop">Resume on file — auto-fill applied to skills where detected.</p>
            )}
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm text-ink-soft">Skills detected</p>
            <div className="flex flex-wrap gap-1.5">
              {(user?.candidateProfile?.skills || []).length === 0 && <p className="text-xs text-ink-muted">None yet — upload a resume to auto-fill.</p>}
              {(user?.candidateProfile?.skills || []).map((s) => (
                <span key={s} className="rounded-full border border-border px-2.5 py-1 text-xs">{s}</span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm text-ink-soft">Saved searches</p>
            {(user?.candidateProfile?.savedSearches || []).length === 0 ? (
              <p className="text-xs text-ink-muted">None yet.</p>
            ) : (
              <ul className="space-y-1">
                {user!.candidateProfile!.savedSearches.map((s) => (
                  <li key={s._id} className="text-sm text-ink-soft">{s.name}</li>
                ))}
              </ul>
            )}
          </div>

          <Link to="/jobs" className="btn-secondary mt-6 w-full">Browse more jobs</Link>
        </div>

        <div>
          <h3 className="font-serif text-xl">Application tracker</h3>
          {applications.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No applications yet — your one-click applies will show up here.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {applications.map((a) => {
                const job = typeof a.job === 'object' ? a.job : null;
                return (
                  <div key={a._id} className="card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{job?.title}</p>
                        <p className="text-xs text-ink-muted">{job?.companyName} · Applied {new Date(a.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`stage-tag rounded-full px-3 py-1 ${STAGE_COLOR[a.stage]}`}>{STAGE_LABEL[a.stage]}</span>
                    </div>
                    {a.interview?.scheduledAt && (
                      <div className="mt-3 rounded-md bg-loop-tint px-3 py-2 text-xs text-loop-dark">
                        <p className="font-medium">
                          Interview: {new Date(a.interview.scheduledAt).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {a.interview.location && <p className="mt-0.5">{a.interview.mode === 'video' ? 'Link' : a.interview.mode === 'onsite' ? 'Location' : 'Number'}: {a.interview.location}</p>}
                        {a.interview.notes && <p className="mt-0.5 text-loop-dark/80">{a.interview.notes}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
