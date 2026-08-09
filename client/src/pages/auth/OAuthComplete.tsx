import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export function OAuthCompletePage() {
  const { user, loading, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login?error=oauth_failed');
      return;
    }
    // Recruiters who signed up via OAuth have no company name yet — send them
    // to complete their profile instead of straight to an empty dashboard.
    if (user.role === 'recruiter' && !user.companyName) {
      navigate('/dashboard/company-profile?welcome=1');
    } else {
      navigate(user.role === 'recruiter' ? '/dashboard' : '/candidate');
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex h-[60vh] items-center justify-center">
      <p className="font-mono text-sm text-ink-muted">Signing you in…</p>
    </div>
  );
}
