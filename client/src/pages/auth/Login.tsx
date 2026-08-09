import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { OAuthButtons } from '@/components/auth/OAuthButtons';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'recruiter' ? '/dashboard' : '/candidate');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="eyebrow mb-3">Welcome back</p>
      <h1 className="font-serif text-3xl">Log in to HireLoop</h1>

      <div className="mt-8">
        <OAuthButtons />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-border" /> or log in with email <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="mt-2 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Email</label>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Password</label>
          <input
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        New to HireLoop? <Link to="/register" className="text-loop hover:underline">Create an account</Link>
      </p>

      <div className="mt-8 rounded-md border border-border bg-white p-4 text-xs text-ink-muted">
        <p className="mb-1 font-medium text-ink-soft">Demo accounts (seeded)</p>
        <p>growth-recruiter@hireloop-demo.test / Password123!</p>
        <p>meera@hireloop-demo.test / Password123!</p>
      </div>
    </div>
  );
}
