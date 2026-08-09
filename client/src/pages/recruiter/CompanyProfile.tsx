import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { RecruiterSubNav } from '@/components/recruiter/RecruiterSubNav';

export function CompanyProfilePage() {
  const { user, refreshUser } = useAuth();
  const [params] = useSearchParams();
  const isWelcome = params.get('welcome') === '1';

  const [form, setForm] = useState({
    companyName: user?.companyName || '',
    companyWebsite: user?.companyWebsite || '',
    companyDescription: user?.companyDescription || '',
    companyLogoUrl: user?.companyLogoUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function onSave() {
    setSaving(true);
    setError('');
    try {
      // companyName itself is only settable at signup today (it drives the public slug);
      // this endpoint updates the richer profile fields.
      await api.patch('/auth/company-profile', {
        companyWebsite: form.companyWebsite,
        companyDescription: form.companyDescription,
        companyLogoUrl: form.companyLogoUrl,
      });
      await refreshUser();
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop';

  return (
    <>
      <RecruiterSubNav />
    <div className="mx-auto max-w-2xl px-6 py-12">
      {isWelcome && (
        <div className="mb-6 rounded-md border border-loop/30 bg-loop-tint px-4 py-3 text-sm text-loop-dark">
          Welcome! Add a few details so candidates can find your company page.
        </div>
      )}

      <p className="eyebrow mb-3">Company profile</p>
      <h1 className="font-serif text-4xl">Your public page</h1>
      {user?.companySlug && (
        <p className="mt-2 text-sm text-ink-muted">
          Live at <Link to={`/companies/${user.companySlug}`} className="text-loop hover:underline">hireloop.dev/companies/{user.companySlug}</Link>
        </p>
      )}

      <div className="mt-8 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Website</label>
          <input value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} placeholder="https://" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Logo URL</label>
          <input value={form.companyLogoUrl} onChange={(e) => setForm({ ...form, companyLogoUrl: e.target.value })} placeholder="https://…/logo.png" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">About the company</label>
          <textarea rows={5} value={form.companyDescription} onChange={(e) => setForm({ ...form, companyDescription: e.target.value })}
            placeholder="What you build, team size, culture — this shows on your public page." className={inputClass} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-loop">Saved.</p>}

        <button onClick={onSave} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save profile'}</button>
      </div>
    </div>
    </>
  );
}
