import { Parser as CsvParser } from 'json2csv';
import Application, { PIPELINE_STAGES } from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { computeMatchScore } from '../services/resumeParser.js';
import { sendNewApplicantEmail, sendApplicationStatusEmail, sendInterviewScheduledEmail } from '../services/emailService.js';

/** Candidate applies to a job. Resume file already uploaded via multer -> req.file. */
export async function applyToJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job || job.status !== 'active') {
      return res.status(404).json({ error: 'Job not found or no longer accepting applications', code: 'JOB_NOT_FOUND' });
    }

    const existing = await Application.findOne({ job: job._id, candidate: req.user._id });
    if (existing) {
      return res.status(409).json({ error: 'You already applied to this job', code: 'ALREADY_APPLIED' });
    }

    const resumeUrl = req.file ? `/uploads/${req.file.filename}` : req.user.candidateProfile?.resumeUrl;
    if (!resumeUrl) {
      return res.status(400).json({ error: 'A resume is required to apply', code: 'RESUME_REQUIRED' });
    }

    const resumeText = req.resumeText || req.user.candidateProfile?.resumeText || '';
    const matchScore = computeMatchScore(resumeText, job.descriptionText);

    const application = await Application.create({
      job: job._id,
      candidate: req.user._id,
      recruiter: job.recruiter,
      resumeUrl,
      resumeText,
      coverNote: req.body.coverNote || '',
      matchScore,
      stageHistory: [{ stage: 'applied', changedBy: req.user._id }],
    });

    job.applicationsCount += 1;
    await job.save();

    const recruiter = await User.findById(job.recruiter);
    if (recruiter) sendNewApplicantEmail(recruiter, job, req.user).catch((e) => console.error(e));

    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
}

/** Candidate's own application list with status. */
export async function myApplications(req, res, next) {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate('job', 'title companyName location workMode status')
      .sort({ createdAt: -1 });
    res.json({ applications });
  } catch (err) {
    next(err);
  }
}

/**
 * Recruiter's applicant list for a job.
 * `applicantFiltering` (by stage / match score threshold) is plan-gated
 * upstream via requirePlanFeature on the route for the *filtered* query params.
 */
export async function listApplicants(req, res, next) {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, recruiter: { $in: req.teamScope.teamUserIds } });
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });

    const filter = { job: job._id };
    if (req.query.stage) filter.stage = req.query.stage;
    if (req.query.minMatch) filter.matchScore = { $gte: Number(req.query.minMatch) };

    const applications = await Application.find(filter)
      .populate('candidate', 'name email candidateProfile.headline candidateProfile.skills candidateProfile.experienceYears candidateProfile.location')
      .sort({ matchScore: -1, createdAt: -1 });

    // Group by pipeline stage for the kanban board.
    const board = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, []]));
    for (const app of applications) board[app.stage].push(app);

    res.json({ board, total: applications.length });
  } catch (err) {
    next(err);
  }
}

/** Move a candidate through the ATS pipeline. Plan-gated via requirePlanFeature('atsPipeline'). */
export async function updateApplicationStage(req, res, next) {
  try {
    const application = await Application.findOne({ _id: req.params.id, recruiter: { $in: req.teamScope.teamUserIds } }).populate('job candidate');
    if (!application) return res.status(404).json({ error: 'Application not found', code: 'APPLICATION_NOT_FOUND' });

    const { stage } = req.body;
    application.stage = stage;
    application.stageHistory.push({ stage, changedBy: req.user._id });
    await application.save();

    sendApplicationStatusEmail(application.candidate, application.job, stage).catch((e) => console.error(e));

    res.json({ application });
  } catch (err) {
    next(err);
  }
}

/**
 * Schedules an interview: sets stage to 'interviewed', records date/time/venue,
 * and emails the candidate the specifics automatically. This is the richer
 * alternative to a bare stage change when the recruiter has the details in hand.
 */
export async function scheduleInterview(req, res, next) {
  try {
    const application = await Application.findOne({ _id: req.params.id, recruiter: { $in: req.teamScope.teamUserIds } }).populate('job candidate');
    if (!application) return res.status(404).json({ error: 'Application not found', code: 'APPLICATION_NOT_FOUND' });

    const { scheduledAt, mode, location, notes } = req.body;

    application.interview = {
      scheduledAt,
      mode,
      location,
      notes,
      scheduledBy: req.user._id,
      notifiedAt: new Date(),
    };
    if (application.stage !== 'interviewed') {
      application.stage = 'interviewed';
      application.stageHistory.push({ stage: 'interviewed', changedBy: req.user._id });
    }
    await application.save();

    sendInterviewScheduledEmail(application.candidate, application.job, application.interview).catch((e) => console.error('[email] interview scheduled failed', e));

    res.json({ application });
  } catch (err) {
    next(err);
  }
}

/** CSV export of applicants for a job. Plan-gated via requirePlanFeature('csvExport'). */
export async function exportApplicantsCsv(req, res, next) {
  try {
    const job = await Job.findOne({ _id: req.params.jobId, recruiter: { $in: req.teamScope.teamUserIds } });
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });

    const applications = await Application.find({ job: job._id }).populate('candidate', 'name email');

    const rows = applications.map((a) => ({
      candidateName: a.candidate?.name,
      candidateEmail: a.candidate?.email,
      stage: a.stage,
      matchScore: a.matchScore,
      appliedAt: a.createdAt.toISOString(),
      resumeUrl: a.resumeUrl,
    }));

    const parser = new CsvParser({ fields: ['candidateName', 'candidateEmail', 'stage', 'matchScore', 'appliedAt', 'resumeUrl'] });
    const csv = parser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment(`${job.title.replace(/\s+/g, '-')}-applicants.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
