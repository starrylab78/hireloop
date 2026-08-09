import { useState } from 'react';
import { LifeBuoy, X, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const RECRUITER_FAQ = [
  { q: 'Why can\'t I move a candidate through the pipeline?', a: 'The ATS pipeline (drag-and-drop stages) is a Growth and Scale feature. On the Free plan you can view applicants but can\'t change their stage — upgrade from Dashboard → Manage plan.' },
  { q: 'Why is "Post a job" blocked?', a: 'Each plan caps active postings: Free (1), Growth (10), Scale (unlimited). Close an existing post or upgrade to publish a new one.' },
  { q: 'How do I export applicants to CSV?', a: 'From a job\'s applicant board, click "Export CSV" — available on Growth and Scale plans.' },
  { q: 'How do I cancel or change my subscription?', a: 'Go to Dashboard → Billing. Click "Switch to..." on another plan to upgrade, or "Cancel subscription" to cancel — you keep access until the end of your current billing cycle.' },
];

const CANDIDATE_FAQ = [
  { q: 'How is the match score calculated?', a: 'It\'s a keyword-overlap score between your resume text and the job description — not a guarantee of fit, just a quick signal for where to look first.' },
  { q: 'Do I need to upload a resume every time I apply?', a: 'No — upload it once from your dashboard and we\'ll reuse it for one-click applies unless you attach a different one.' },
  { q: 'How do I save a job or search?', a: 'Tap the bookmark icon on a job card (or swipe it on mobile) to save a job. Use "Save search" on the job feed to save your current filters.' },
  { q: 'Can recruiters see my saved jobs?', a: 'No — saved jobs and saved searches are private to your account.' },
];

export function HelpWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const faqs = user?.role === 'recruiter' ? RECRUITER_FAQ : CANDIDATE_FAQ;
  const audienceLabel = user?.role === 'recruiter' ? 'for recruiters' : 'for candidates';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-ink px-4 py-3 text-sm font-medium text-paper shadow-card transition-colors hover:bg-loop-dark"
        aria-label="Need help?"
      >
        <LifeBuoy className="h-4 w-4" />
        <span className="hidden sm:inline">Need help?</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-ink/20 p-0 sm:items-center sm:p-6" onClick={() => setOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-lg border border-border bg-white p-6 shadow-card sm:max-w-md sm:rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow mb-1">Help {audienceLabel}</p>
                <h3 className="font-serif text-xl">Quick answers</h3>
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-muted hover:text-ink" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {faqs.map((item) => (
                <details key={item.q} className="group rounded-md border border-border p-3 open:border-loop">
                  <summary className="cursor-pointer list-none text-sm font-medium text-ink-soft group-open:text-ink">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-ink-muted">{item.a}</p>
                </details>
              ))}
            </div>

            <a
              href="/contact"
              className="btn-secondary mt-6 flex w-full items-center justify-center gap-2 text-sm"
            >
              <Mail className="h-4 w-4" />
              Still stuck? Contact us
            </a>
          </div>
        </div>
      )}
    </>
  );
}
