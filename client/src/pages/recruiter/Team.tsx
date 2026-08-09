import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Organization, TeamInvite } from '@/types';
import { RecruiterSubNav } from '@/components/recruiter/RecruiterSubNav';

export function TeamPage() {
  const { user } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/organizations/mine');
    setOrg(data.organization);
    setInvites(data.pendingInvites || []);
  }

  async function sendInvite() {
    setInviting(true);
    setError('');
    setMessage('');
    try {
      await api.post('/organizations/invite', { email });
      setEmail('');
      setMessage('Invite sent.');
      load();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not send invite.');
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(userId: string) {
    if (!window.confirm('Remove this teammate? They will lose access to shared jobs.')) return;
    await api.delete(`/organizations/members/${userId}`);
    load();
  }

  const isOwner = !org || org.owner === user?._id;
  const seatsUsed = (org?.members.length || (user ? 1 : 0)) + invites.length;

  return (
    <>
      <RecruiterSubNav />
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="eyebrow mb-3">Team</p>
      <h1 className="font-serif text-4xl">Manage your team</h1>

      {user?.plan !== 'scale' ? (
        <div className="card mt-8 p-6">
          <p className="text-ink-soft">Team seats are a <strong>Scale</strong> plan feature — invite up to 5 teammates to share your job pipeline.</p>
          <a href="/dashboard/billing" className="btn-primary mt-4 inline-flex">Upgrade to Scale</a>
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-muted">{seatsUsed} / 5 seats used</p>

          {isOwner && (
            <div className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="teammate@company.com"
                className="flex-1 rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop"
              />
              <button onClick={sendInvite} disabled={inviting || !email} className="btn-primary whitespace-nowrap">
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          {message && <p className="mt-2 text-sm text-loop">{message}</p>}

          <div className="mt-8">
            <h3 className="font-serif text-xl">Members</h3>
            <div className="mt-3 space-y-2">
              {(org?.members || []).map((m) => (
                <div key={m.user._id} className="card flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium">{m.user.name}</p>
                    <p className="text-xs text-ink-muted">{m.user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="stage-tag rounded-full bg-border/40 px-2.5 py-1 capitalize">{m.role}</span>
                    {isOwner && m.role !== 'owner' && (
                      <button onClick={() => removeMember(m.user._id)} className="text-xs text-red-600 hover:underline">Remove</button>
                    )}
                  </div>
                </div>
              ))}
              {!org && <p className="text-sm text-ink-muted">Send your first invite to create your team.</p>}
            </div>
          </div>

          {invites.length > 0 && (
            <div className="mt-8">
              <h3 className="font-serif text-xl">Pending invites</h3>
              <div className="mt-3 space-y-2">
                {invites.map((inv) => (
                  <div key={inv._id} className="card flex items-center justify-between p-4">
                    <p className="text-sm">{inv.email}</p>
                    <span className="stage-tag rounded-full bg-gold/15 px-2.5 py-1 text-gold-dark">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
