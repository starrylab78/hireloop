import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';

interface CompanyJob {
  _id: string;
  title: string;
  location: string;
  workMode: string;
  experienceLevel: string;
  salaryMin: number | null;
  salaryMax: number | null;
}
interface CompanyData {
  name: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  slug: string;
}

export function CompanyPublicPage() {
  const { slug } = useParams();
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api.get(`/companies/${slug}`)
      .then(({ data }) => { setCompany(data.company); setJobs(data.jobs); })
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) {
    return <div className="mx-auto max-w-2xl px-6 py-24 text-center text-ink-muted">This company page doesn't exist.</div>;
  }
  if (!company) return <div className="mx-auto max-w-2xl px-6 py-24 text-center text-ink-muted">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center gap-4">
        {company.logoUrl ? (
          <img src={company.logoUrl} alt="" className="h-16 w-16 rounded-md border border-border object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-loop-tint font-serif text-2xl text-loop">
            {company.name?.[0] || '?'}
          </div>
        )}
        <div>
          <h1 className="font-serif text-3xl">{company.name}</h1>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" className="text-sm text-loop hover:underline">
              {company.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>
      </div>

      {company.description && <p className="mt-6 max-w-2xl text-ink-soft">{company.description}</p>}

      <h2 className="mt-12 font-serif text-2xl">Open roles ({jobs.length})</h2>
      <div className="mt-5 space-y-3">
        {jobs.length === 0 && <p className="text-sm text-ink-muted">No open roles right now — check back soon.</p>}
        {jobs.map((job) => {
          const salary = job.salaryMin && job.salaryMax ? `₹${(job.salaryMin / 100000).toFixed(0)}–${(job.salaryMax / 100000).toFixed(0)} LPA` : null;
          return (
            <Link key={job._id} to={`/jobs/${job._id}`} className="card flex items-center justify-between p-5 hover:border-loop">
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-xs text-ink-muted">{job.location} · <span className="capitalize">{job.workMode}</span> · <span className="capitalize">{job.experienceLevel}</span></p>
              </div>
              {salary && <p className="text-sm text-ink-soft">{salary}</p>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
