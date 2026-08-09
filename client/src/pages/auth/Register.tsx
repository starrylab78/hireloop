import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import type { Role } from '@/types';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [form, setForm] = useState({ name: '', email: '', password: '', companyName: '', companyWebsite: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(role === 'recruiter' ? '/dashboard' : '/candidate');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="eyebrow mb-3">Join HireLoop</p>
      <h1 className="font-serif text-3xl">Create your account</h1>

      <div className="mt-6 flex rounded-md border border-border bg-white p-1">
        {(['candidate', 'recruiter'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex-1 rounded-sm py-2 text-sm font-medium capitalize transition-colors ${
              role === r ? 'bg-ink text-paper' : 'text-ink-soft'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <OAuthButtons role={role} />
        {role === 'recruiter' && (
          <p className="mt-2 text-xs text-ink-muted">You'll add your company name after signing in with Google/LinkedIn.</p>
        )}
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-border" /> or sign up with email <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="mt-2 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Full name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Password</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop" />
          <p className="mt-1 text-xs text-ink-muted">At least 8 characters.</p>
        </div>

        {role === 'recruiter' && (
          <>
            <div>
              <label className="mb-1.5 block text-sm text-ink-soft">Company name</label>
              <input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-ink-soft">Company website</label>
              <input type="url" placeholder="https://" value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
                className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop" />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        Already have an account? <Link to="/login" className="text-loop hover:underline">Log in</Link>
      </p>
    </div>
  );
}
