import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Job } from '@/types';
import { RecruiterSubNav } from '@/components/recruiter/RecruiterSubNav';

const PLAN_LIMITS: Record<string, number> = { free: 1, growth: 10, scale: Infinity };
const FUNNEL_COLORS = ['#DEDDD4', '#2E8A73', '#1F5F4F', '#E8B14D'];

export function RecruiterDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [funnel, setFunnel] = useState<{ stage: string; count: number }[]>([]);

  useEffect(() => {
    api.get('/jobs/mine').then(({ data }) => setJobs(data.jobs));
    api.get('/jobs/analytics/funnel').then(({ data }) => setFunnel(data.funnel));
  }, []);

  const activeCount = jobs.filter((j) => j.status === 'active').length;
  const limit = PLAN_LIMITS[user?.plan || 'free'];

  return (
    <>
      <RecruiterSubNav />
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Recruiter dashboard</p>
          <h1 className="font-serif text-4xl">{user?.companyName}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/post-job" className="btn-primary">Post a job</Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card p-5">
          <p className="stage-tag text-ink-muted">Plan</p>
          <p className="mt-2 font-serif text-2xl capitalize">{user?.plan}</p>
        </div>
        <div className="card p-5">
          <p className="stage-tag text-ink-muted">Active postings</p>
          <p className="mt-2 font-serif text-2xl">{activeCount} <span className="text-base text-ink-muted">/ {limit === Infinity ? '∞' : limit}</span></p>
        </div>
        <div className="card p-5">
          <p className="stage-tag text-ink-muted">Total applicants</p>
          <p className="mt-2 font-serif text-2xl">{jobs.reduce((sum, j) => sum + j.applicationsCount, 0)}</p>
        </div>
      </div>

      <div className="card mt-8 p-6">
        <h3 className="font-serif text-xl">Hiring funnel</h3>
        <p className="text-sm text-ink-muted">Applied → screened → interviewed → hired, across all open roles.</p>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnel} margin={{ left: -20 }}>
              <XAxis dataKey="stage" tick={{ fontSize: 12, fill: '#5B6560' }} axisLine={{ stroke: '#DEDDD4' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#5B6560' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #DEDDD4', fontSize: 13 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {funnel.map((_, i) => <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-serif text-xl">Your postings</h3>
        <div className="mt-4 space-y-3">
          {jobs.length === 0 && <p className="text-sm text-ink-muted">No postings yet — publish your first job to get started.</p>}
          {jobs.map((job) => (
            <div key={job._id} className="card flex items-center justify-between p-5">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-ink-muted">{job.views} views · {job.applicationsCount} applicants · <span className="capitalize">{job.status}</span></p>
              </div>
              <div className="flex gap-2">
                <Link to={`/dashboard/jobs/${job._id}/applicants`} className="btn-secondary py-2 px-4 text-sm">View applicants</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
