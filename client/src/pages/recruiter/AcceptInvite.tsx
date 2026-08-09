import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function AcceptInvitePage() {
  const { token } = useParams();
  const { user, loading, refreshUser } = useAuth();
  const [status, setStatus] = useState<'idle' | 'accepting' | 'accepted' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (loading || !user || status !== 'idle') return;
    accept();
  }, [loading, user]); // eslint-disable-line

  async function accept() {
    setStatus('accepting');
    try {
      await api.post(`/organizations/invite/${token}/accept`);
      await refreshUser();
      setStatus('accepted');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'This invite could not be accepted.');
      setStatus('error');
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-serif text-3xl">Log in to accept this invite</h1>
        <p className="mt-3 text-ink-soft">Sign in (or create an account) with the email address the invite was sent to, then revisit this link.</p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">Log in</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center">
      {status === 'accepted' ? (
        <>
          <h1 className="font-serif text-3xl">You're on the team</h1>
          <p className="mt-3 text-ink-soft">You now have access to your team's shared job pipeline.</p>
          <Link to="/dashboard" className="btn-primary mt-6 inline-flex">Go to dashboard</Link>
        </>
      ) : status === 'error' ? (
        <>
          <h1 className="font-serif text-3xl">Couldn't accept invite</h1>
          <p className="mt-3 text-red-600">{error}</p>
        </>
      ) : (
        <p className="text-ink-muted">Joining team…</p>
      )}
    </div>
  );
}
