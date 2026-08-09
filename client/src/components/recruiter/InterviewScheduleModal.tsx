import { useState } from 'react';
import { X } from 'lucide-react';
import type { InterviewMode } from '@/types';

export interface ScheduleInterviewPayload {
  scheduledAt: string;
  mode: InterviewMode;
  location: string;
  notes: string;
}

export function InterviewScheduleModal({
  candidateName,
  defaultMode,
  defaultLocation,
  onCancel,
  onConfirm,
  submitting,
}: {
  candidateName: string;
  defaultMode: InterviewMode;
  defaultLocation: string;
  onCancel: () => void;
  onConfirm: (payload: ScheduleInterviewPayload) => void;
  submitting: boolean;
}) {
  const [scheduledAt, setScheduledAt] = useState('');
  const [mode, setMode] = useState<InterviewMode>(defaultMode);
  const [location, setLocation] = useState(defaultLocation);
  const [notes, setNotes] = useState('');

  const inputClass = 'w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-loop';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-lg border border-border bg-white p-6 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow mb-1">Schedule interview</p>
            <h3 className="font-serif text-xl">{candidateName}</h3>
          </div>
          <button onClick={onCancel} className="text-ink-muted hover:text-ink" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">Date & time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">Format</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as InterviewMode)} className={inputClass}>
              <option value="video">Video call</option>
              <option value="onsite">In person</option>
              <option value="phone">Phone call</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">
              {mode === 'video' ? 'Meeting link' : mode === 'onsite' ? 'Venue address' : 'Callback number'}
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={inputClass}
              placeholder={mode === 'video' ? 'https://meet.google.com/...' : mode === 'onsite' ? '123 Main St, Suite 4' : '+91 98765 43210'}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-ink-soft">Notes for the candidate (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
              placeholder="What to bring, who they'll meet, anything else useful"
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-ink-muted">The candidate gets an email with these details as soon as you confirm.</p>

        <div className="mt-5 flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => scheduledAt && onConfirm({ scheduledAt, mode, location, notes })}
            disabled={!scheduledAt || submitting}
            className="btn-primary flex-1"
          >
            {submitting ? 'Sending…' : 'Confirm & notify'}
          </button>
        </div>
      </div>
    </div>
  );
}
