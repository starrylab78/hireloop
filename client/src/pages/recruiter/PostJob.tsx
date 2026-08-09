import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { JobDescriptionEditor } from '@/components/recruiter/JobDescriptionEditor';
import { RecruiterSubNav } from '@/components/recruiter/RecruiterSubNav';

export function PostJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', companyName: '', location: '', workMode: 'onsite', experienceLevel: 'mid',
    employmentType: 'full-time', salaryMin: '', salaryMax: '', skills: '',
    defaultInterviewMode: 'video', defaultInterviewLocation: '',
  });
  const [descriptionHtml, setDescriptionHtml] = useState('<p></p>');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/jobs', {
        ...form,
        descriptionHtml,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not publish this job.');
    } finally {
      setSubmitting(false);
    }
  }

  const field = (label: string, node: React.ReactNode) => (
    <div>
      <label className="mb-1.5 block text-sm text-ink-soft">{label}</label>
      {node}
    </div>
  );
  const inputClass = 'w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop';

  return (
    <>
      <RecruiterSubNav />
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="eyebrow mb-3">New posting</p>
      <h1 className="font-serif text-4xl">Post a job</h1>

      <div className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-5">
          {field('Job title', <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />)}
          {field('Company name', <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className={inputClass} />)}
        </div>
        <div className="grid grid-cols-3 gap-5">
          {field('Location', <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="Bengaluru, IN" />)}
          {field('Work mode', (
            <select value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value })} className={inputClass}>
              <option value="onsite">Onsite</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option>
            </select>
          ))}
          {field('Experience level', (
            <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })} className={inputClass}>
              <option value="entry">Entry</option><option value="mid">Mid</option><option value="senior">Senior</option><option value="lead">Lead</option>
            </select>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-5">
          {field('Salary min (₹/yr)', <input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} className={inputClass} />)}
          {field('Salary max (₹/yr)', <input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} className={inputClass} />)}
        </div>
        {field('Skills (comma separated)', <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className={inputClass} placeholder="react, typescript, node.js" />)}

        <div className="rounded-md border border-border bg-white p-4">
          <p className="mb-1 text-sm font-medium text-ink">Default interview details</p>
          <p className="mb-4 text-xs text-ink-muted">Optional — pre-fills the scheduling form when you move a candidate to "Interviewed," so you're not retyping the same link or address every time. You can always change it per candidate.</p>
          <div className="grid grid-cols-2 gap-5">
            {field('Format', (
              <select value={form.defaultInterviewMode} onChange={(e) => setForm({ ...form, defaultInterviewMode: e.target.value })} className={inputClass}>
                <option value="video">Video call</option>
                <option value="onsite">In person</option>
                <option value="phone">Phone call</option>
              </select>
            ))}
            {field(
              form.defaultInterviewMode === 'video' ? 'Default meeting link' : form.defaultInterviewMode === 'onsite' ? 'Default venue address' : 'Default callback number',
              <input
                value={form.defaultInterviewLocation}
                onChange={(e) => setForm({ ...form, defaultInterviewLocation: e.target.value })}
                className={inputClass}
                placeholder={form.defaultInterviewMode === 'video' ? 'https://meet.google.com/...' : form.defaultInterviewMode === 'onsite' ? '123 Main St, Suite 4' : '+91 98765 43210'}
              />
            )}
          </div>
        </div>

        {field('Job description', <JobDescriptionEditor value={descriptionHtml} onChange={setDescriptionHtml} title={form.title} companyName={form.companyName} />)}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button onClick={onSubmit} disabled={submitting} className="btn-primary">
          {submitting ? 'Publishing…' : 'Publish job'}
        </button>
      </div>
    </div>
    </>
  );
}
