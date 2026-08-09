import { Link, useLocation } from 'react-router-dom';

const TABS = [
  { to: '/dashboard', label: 'Overview', exact: true },
  { to: '/dashboard/post-job', label: 'Post a job' },
  { to: '/dashboard/talent-pool', label: 'Talent pool' },
  { to: '/dashboard/team', label: 'Team' },
  { to: '/dashboard/company-profile', label: 'Company page' },
  { to: '/dashboard/billing', label: 'Billing' },
];

export function RecruiterSubNav() {
  const location = useLocation();

  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
        {TABS.map((tab) => {
          const active = tab.exact ? location.pathname === tab.to : location.pathname.startsWith(tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active ? 'border-loop text-ink' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
