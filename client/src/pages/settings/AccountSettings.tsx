import { useState, FormEvent } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export function AccountSettingsPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', companyName: user?.companyName || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const isOAuthOnly = !user?.hasPassword; // account has no local password yet (Google/LinkedIn sign-in)

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.patch('/auth/profile', profile);
      await refreshUser();
      setProfileMsg({ type: 'ok', text: 'Profile updated.' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err?.response?.data?.error || 'Could not update your profile.' });
    } finally {
      setProfileSaving(false);
    }
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (pw.newPassword !== pw.confirmPassword) {
      setPwMsg({ type: 'error', text: "New passwords don't match." });
      return;
    }
    setPwSaving(true);
    try {
      await api.patch('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwMsg({ type: 'ok', text: isOAuthOnly ? 'Password set. You can now log in with email + password too.' : 'Password updated.' });
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err?.response?.data?.error || 'Could not update your password.' });
    } finally {
      setPwSaving(false);
    }
  }

  const inputClass = 'w-full rounded-md border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-loop';

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="eyebrow mb-3">Account</p>
      <h1 className="font-serif text-4xl">Settings</h1>

      <form onSubmit={saveProfile} className="card mt-8 space-y-5 p-6">
        <h3 className="font-serif text-xl">Profile</h3>
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Full name</label>
          <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Email</label>
          <input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className={inputClass} />
        </div>
        {user?.role === 'recruiter' && (
          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">Company name</label>
            <input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} className={inputClass} />
            <p className="mt-1 text-xs text-ink-muted">
              For website, logo, and description, use <a href="/dashboard/company-profile" className="text-loop hover:underline">Company page</a> instead.
            </p>
          </div>
        )}
        {profileMsg && <p className={`text-sm ${profileMsg.type === 'ok' ? 'text-loop' : 'text-red-600'}`}>{profileMsg.text}</p>}
        <button type="submit" disabled={profileSaving} className="btn-primary">
          {profileSaving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <form onSubmit={savePassword} className="card mt-6 space-y-5 p-6">
        <h3 className="font-serif text-xl">Password</h3>
        {isOAuthOnly && (
          <p className="text-sm text-ink-muted">
            Your account uses Google/LinkedIn sign-in and has no password yet. Set one below to also be able to log in with email + password.
          </p>
        )}
        {!isOAuthOnly && (
          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">Current password</label>
            <input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} className={inputClass} />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">New password</label>
          <input type="password" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-ink-soft">Confirm new password</label>
          <input type="password" minLength={8} value={pw.confirmPassword} onChange={(e) => setPw({ ...pw, confirmPassword: e.target.value })} className={inputClass} />
        </div>
        {pwMsg && <p className={`text-sm ${pwMsg.type === 'ok' ? 'text-loop' : 'text-red-600'}`}>{pwMsg.text}</p>}
        <button type="submit" disabled={pwSaving} className="btn-primary">
          {pwSaving ? 'Updating…' : isOAuthOnly ? 'Set password' : 'Update password'}
        </button>
        <p className="text-xs text-ink-muted">Changing your password logs out any other devices you're signed in on.</p>
      </form>
    </div>
  );
}
