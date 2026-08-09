import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { TalentPoolEntry } from '@/types';
import { RecruiterSubNav } from '@/components/recruiter/RecruiterSubNav';

export function TalentPoolPage() {
  const [entries, setEntries] = useState<TalentPoolEntry[]>([]);
  const [openMessageFor, setOpenMessageFor] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await api.get('/talent-pool');
    setEntries(data.entries);
  }

  async function remove(id: string) {
    await api.delete(`/talent-pool/${id}`);
    load();
  }

  async function sendMessage(id: string) {
    setSending(true);
    try {
      await api.post(`/talent-pool/${id}/recontact`, { message });
      setOpenMessageFor(null);
      setMessage('');
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <RecruiterSubNav />
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="eyebrow mb-3">Talent pool</p>
      <h1 className="font-serif text-4xl">Candidates worth remembering</h1>
      <p className="mt-2 text-ink-soft">Save strong applicants here even if they're not right for the current role — and reach out again when a better fit opens up.</p>

      {entries.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">
          Nothing saved yet. From any job's applicant board, save a candidate to your talent pool to see them here.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {entries.map((entry) => (
            <div key={entry._id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{entry.candidate.name}</p>
                  <p className="text-xs text-ink-muted">{entry.candidate.email}</p>
                  {entry.sourceJobTitle && <p className="mt-1 text-xs text-ink-muted">Originally applied to: {entry.sourceJobTitle}</p>}
                  {entry.candidate.candidateProfile?.skills && entry.candidate.candidateProfile.skills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.candidate.candidateProfile.skills.slice(0, 6).map((s) => (
                        <span key={s} className="rounded-full border border-border px-2 py-0.5 text-xs">{s}</span>
                      ))}
                    </div>
                  )}
                  {entry.lastContactedAt && (
                    <p className="mt-2 text-xs text-loop">Last contacted {new Date(entry.lastContactedAt).toLocaleDateString()}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => setOpenMessageFor(entry._id === openMessageFor ? null : entry._id)} className="btn-secondary py-2 px-3 text-xs">
                    Re-contact
                  </button>
                  <button onClick={() => remove(entry._id)} className="text-xs text-red-600 hover:underline">Remove</button>
                </div>
              </div>

              {openMessageFor === entry._id && (
                <div className="mt-4 border-t border-border pt-4">
                  <textarea
                    value={message} onChange={(e) => setMessage(e.target.value)} rows={3}
                    placeholder={`Hi ${entry.candidate.name.split(' ')[0]}, we have a new role that might be a great fit…`}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-loop"
                  />
                  <button onClick={() => sendMessage(entry._id)} disabled={sending || !message.trim()} className="btn-primary mt-2 py-2 px-4 text-sm">
                    {sending ? 'Sending…' : 'Send email'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  );
}
