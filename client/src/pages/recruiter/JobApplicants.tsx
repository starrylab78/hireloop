import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { api } from '@/lib/api';
import type { Application, PipelineStage, Job, InterviewMode } from '@/types';
import { RecruiterSubNav } from '@/components/recruiter/RecruiterSubNav';
import { InterviewScheduleModal, ScheduleInterviewPayload } from '@/components/recruiter/InterviewScheduleModal';

const STAGES: PipelineStage[] = ['applied', 'screened', 'interviewed', 'offered', 'hired', 'rejected'];
const STAGE_LABEL: Record<PipelineStage, string> = {
  applied: 'Applied', screened: 'Screened', interviewed: 'Interviewed', offered: 'Offered', hired: 'Hired', rejected: 'Rejected',
};

export function JobApplicantsPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [board, setBoard] = useState<Record<PipelineStage, Application[]> | null>(null);
  const [error, setError] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [schedulingFor, setSchedulingFor] = useState<Application | null>(null);
  const [scheduling, setScheduling] = useState(false);

  useEffect(() => { loadBoard(); loadJob(); }, [jobId]); // eslint-disable-line

  async function loadJob() {
    try {
      const { data } = await api.get(`/jobs/${jobId}`);
      setJob(data.job);
    } catch {
      // Non-fatal — the scheduling modal just falls back to blank defaults.
    }
  }

  async function loadBoard() {
    try {
      const { data } = await api.get(`/applications/jobs/${jobId}/applicants`);
      setBoard(data.board);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not load applicants.');
    }
  }

  async function moveStage(applicationId: string, stage: PipelineStage) {
    try {
      await api.patch(`/applications/${applicationId}/stage`, { stage });
      loadBoard();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'This plan does not include the ATS pipeline. Upgrade to move candidates through stages.');
    }
  }

  function handleDrop(stage: PipelineStage) {
    if (!dragId) return;
    const app = findApplication(dragId);
    setDragId(null);
    if (!app) return;

    // Dropping into "Interviewed" opens the scheduling modal instead of a bare
    // stage change, so the candidate automatically gets date/time/venue by email.
    if (stage === 'interviewed') {
      setSchedulingFor(app);
      return;
    }
    moveStage(app._id, stage);
  }

  function findApplication(id: string): Application | null {
    if (!board) return null;
    for (const stage of STAGES) {
      const found = board[stage]?.find((a) => a._id === id);
      if (found) return found;
    }
    return null;
  }

  async function confirmSchedule(payload: ScheduleInterviewPayload) {
    if (!schedulingFor) return;
    setScheduling(true);
    setError('');
    try {
      await api.post(`/applications/${schedulingFor._id}/schedule-interview`, payload);
      setSchedulingFor(null);
      loadBoard();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not schedule this interview.');
    } finally {
      setScheduling(false);
    }
  }

  async function exportCsv() {
    try {
      const res = await api.get(`/applications/jobs/${jobId}/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'applicants.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'CSV export is not included in your current plan.');
    }
  }

  async function saveToTalentPool(app: Application) {
    const candidateId = typeof app.candidate === 'object' ? app.candidate._id : app.candidate;
    try {
      await api.post('/talent-pool', { candidateId, applicationId: app._id });
      setSavedIds((prev) => new Set(prev).add(app._id));
    } catch {
      setError('Could not save this candidate to your talent pool.');
    }
  }

  return (
    <>
      <RecruiterSubNav />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow mb-3">Applicant pipeline</p>
            <h1 className="font-serif text-3xl">Track candidates</h1>
          </div>
          <button onClick={exportCsv} className="btn-secondary">Export CSV</button>
        </div>

        {error && <p className="mt-4 rounded-md bg-gold/10 px-4 py-3 text-sm text-gold-dark">{error}</p>}

        <div className="mt-8 grid grid-cols-1 gap-4 overflow-x-auto md:grid-cols-6">
          {STAGES.map((stage) => (
            <div
              key={stage}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(stage)}
              className="min-h-[300px] rounded-lg border border-border bg-white/60 p-3"
            >
              <p className="stage-tag mb-3 text-ink-muted">{STAGE_LABEL[stage]} ({board?.[stage]?.length ?? 0})</p>
              <div className="space-y-2">
                {board?.[stage]?.map((app) => {
                  const candidate = typeof app.candidate === 'object' ? app.candidate : null;
                  return (
                    <div
                      key={app._id}
                      draggable
                      onDragStart={() => setDragId(app._id)}
                      className="card cursor-grab p-3 active:cursor-grabbing"
                    >
                      <p className="text-sm font-medium">{candidate?.name}</p>
                      <p className="text-xs text-ink-muted">{candidate?.email}</p>

                      {app.interview?.scheduledAt && (
                        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-loop">
                          <CalendarClock className="h-3 w-3" />
                          {new Date(app.interview.scheduledAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <p className="stage-tag rounded-full bg-loop-tint px-2 py-0.5 text-loop inline-block">{app.matchScore}% match</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); saveToTalentPool(app); }}
                          disabled={savedIds.has(app._id)}
                          className="text-[11px] text-ink-muted hover:text-loop disabled:text-loop"
                        >
                          {savedIds.has(app._id) ? '✓ Saved' : '+ Talent pool'}
                        </button>
                        {stage === 'interviewed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSchedulingFor(app); }}
                            className="text-[11px] text-ink-muted hover:text-loop"
                          >
                            {app.interview?.scheduledAt ? 'Reschedule' : 'Schedule'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-ink-muted">
          Drag a card into "Interviewed" to schedule a time and automatically email the candidate. Free-plan recruiters can view applicants but need Growth or Scale to move them through the pipeline.
        </p>
      </div>

      {schedulingFor && (
        <InterviewScheduleModal
          candidateName={typeof schedulingFor.candidate === 'object' ? schedulingFor.candidate.name : 'this candidate'}
          defaultMode={(job?.defaultInterviewMode as InterviewMode) || 'video'}
          defaultLocation={job?.defaultInterviewLocation || ''}
          submitting={scheduling}
          onCancel={() => setSchedulingFor(null)}
          onConfirm={confirmSchedule}
        />
      )}
    </>
  );
}
