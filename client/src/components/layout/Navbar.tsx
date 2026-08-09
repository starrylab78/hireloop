import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function LoopMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M11 20C6.6 20 3 16.9 3 13S6.6 6 11 6c3.2 0 6 1.8 7.4 4.5"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
      />
      <path
        d="M21 12c4.4 0 8 3.1 8 7s-3.6 7-8 7c-3.2 0-6-1.8-7.4-4.5"
        stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
      />
    </svg>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const homeLink = user?.role === 'recruiter' ? '/dashboard' : '/candidate';

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-loop">
          <LoopMark />
          <span className="font-serif text-lg font-semibold tracking-tight text-ink">HireLoop</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-ink-soft md:flex">
          <Link to="/jobs" className="hover:text-ink">Find jobs</Link>
          <Link to="/pricing" className="hover:text-ink">Pricing</Link>
          {user?.role === 'recruiter' && <Link to="/dashboard" className="hover:text-ink">Dashboard</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {!user && (
            <>
              <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink">Log in</Link>
              <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get started</Link>
            </>
          )}
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-ink-soft hover:border-ink hover:text-ink"
              >
                {user.name.split(' ')[0]}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-md border border-border bg-white py-1 shadow-card">
                  <Link
                    to={homeLink}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    {user.role === 'recruiter' ? 'Dashboard' : 'My applications'}
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={async () => { setMenuOpen(false); await logout(); navigate('/'); }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
