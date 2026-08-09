import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { sanitizeJobDescription, htmlToPlainText } from '../services/sanitize.js';
import { buildDocFrequency, buildTermVector, rankSimilarJobs } from '../services/similarity.js';
import { generateJobDescription } from '../services/aiJobDescriptionService.js';

export async function generateDescription(req, res, next) {
  try {
    const { title, companyName, bullets, tone } = req.body || {};
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'A job title is required to generate a description', code: 'TITLE_REQUIRED' });
    }
    const cleanBullets = Array.isArray(bullets) ? bullets.filter((b) => typeof b === 'string' && b.trim()).slice(0, 12) : [];

    const { html, source } = await generateJobDescription({ title, companyName, bullets: cleanBullets, tone });
    const sanitized = sanitizeJobDescription(html);
    res.json({ descriptionHtml: sanitized, source });
  } catch (err) {
    next(err);
  }
}

export async function createJob(req, res, next) {
  try {
    const data = req.body;
    const descriptionHtml = sanitizeJobDescription(data.descriptionHtml);
    const descriptionText = htmlToPlainText(descriptionHtml);

    const plan = req.teamScope.planDef;

    const job = await Job.create({
      recruiter: req.user._id,
      title: data.title,
      companyName: data.companyName,
      descriptionHtml,
      descriptionText,
      location: data.location,
      workMode: data.workMode,
      experienceLevel: data.experienceLevel,
      employmentType: data.employmentType,
      salaryMin: data.salaryMin ?? null,
      salaryMax: data.salaryMax ?? null,
      currency: data.currency,
      skills: data.skills,
      priorityListing: plan.priorityListing,
      defaultInterviewMode: data.defaultInterviewMode,
      defaultInterviewLocation: data.defaultInterviewLocation,
    });

    await recomputeTermVectors();

    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
}

export async function updateJob(req, res, next) {
  try {
    const job = await Job.findOne({ _id: req.params.id, recruiter: { $in: req.teamScope.teamUserIds } });
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });

    const data = req.body;
    if (data.descriptionHtml) {
      job.descriptionHtml = sanitizeJobDescription(data.descriptionHtml);
      job.descriptionText = htmlToPlainText(job.descriptionHtml);
    }
    for (const field of ['title', 'companyName', 'location', 'workMode', 'experienceLevel', 'employmentType', 'salaryMin', 'salaryMax', 'currency', 'skills', 'status', 'defaultInterviewMode', 'defaultInterviewLocation']) {
      if (data[field] !== undefined) job[field] = data[field];
    }

    await job.save();
    res.json({ job });
  } catch (err) {
    next(err);
  }
}

export async function deleteJob(req, res, next) {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, recruiter: { $in: req.teamScope.teamUserIds } });
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });
    await Application.deleteMany({ job: job._id });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/** Public job feed — filters, pagination. `applicantFiltering` (advanced filters) is plan-gated. */
export async function listJobs(req, res, next) {
  try {
    const { q, location, workMode, experienceLevel, salaryMin, salaryMax, page, limit } = req.query;

    const filter = { status: 'active' };
    if (q) filter.$text = { $search: q };
    if (location) filter.location = new RegExp(location, 'i');
    if (workMode) filter.workMode = workMode;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (salaryMin || salaryMax) {
      filter.$and = [];
      if (salaryMin) filter.$and.push({ $or: [{ salaryMax: { $gte: salaryMin } }, { salaryMax: null }] });
      if (salaryMax) filter.$and.push({ $or: [{ salaryMin: { $lte: salaryMax } }, { salaryMin: null }] });
    }

    const skip = (page - 1) * limit;
    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ priorityListing: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('recruiter', 'name companyName'),
      Job.countDocuments(filter),
    ]);

    res.json({ jobs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function getJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).populate('recruiter', 'name companyName companyWebsite');
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });

    job.views += 1;
    await job.save();

    const similarCandidates = await Job.find({ _id: { $ne: job._id }, status: 'active' }).limit(200);
    const similar = rankSimilarJobs(job.termVector, similarCandidates, 5).map((r) => ({
      job: { _id: r.job._id, title: r.job.title, companyName: r.job.companyName, location: r.job.location, workMode: r.job.workMode },
      score: Math.round(r.score * 100) / 100,
    }));

    res.json({ job, similar });
  } catch (err) {
    next(err);
  }
}

export async function listMyJobs(req, res, next) {
  try {
    const jobs = await Job.find({ recruiter: { $in: req.teamScope.teamUserIds } }).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (err) {
    next(err);
  }
}

/** Usage analytics: views vs applications per post (Growth+ feature). */
export async function jobAnalytics(req, res, next) {
  try {
    const jobs = await Job.find({ recruiter: { $in: req.teamScope.teamUserIds } }).select('title views applicationsCount createdAt status');
    const data = jobs.map((j) => ({
      jobId: j._id,
      title: j.title,
      views: j.views,
      applications: j.applicationsCount,
      conversionRate: j.views > 0 ? Math.round((j.applicationsCount / j.views) * 1000) / 10 : 0,
      status: j.status,
      createdAt: j.createdAt,
    }));
    res.json({ data });
  } catch (err) {
    next(err);
  }
}

/** Aggregate applied -> screened -> interviewed -> hired counts across all of the recruiter's jobs. */
export async function pipelineFunnel(req, res, next) {
  try {
    const counts = await Application.aggregate([
      { $match: { recruiter: { $in: req.teamScope.teamUserIds } } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);
    const byStage = Object.fromEntries(counts.map((c) => [c._id, c.count]));
    const funnel = [
      { stage: 'Applied', count: (byStage.applied || 0) + (byStage.screened || 0) + (byStage.interviewed || 0) + (byStage.offered || 0) + (byStage.hired || 0) },
      { stage: 'Screened', count: (byStage.screened || 0) + (byStage.interviewed || 0) + (byStage.offered || 0) + (byStage.hired || 0) },
      { stage: 'Interviewed', count: (byStage.interviewed || 0) + (byStage.offered || 0) + (byStage.hired || 0) },
      { stage: 'Hired', count: byStage.hired || 0 },
    ];
    res.json({ funnel });
  } catch (err) {
    next(err);
  }
}

/** Recomputes TF-IDF vectors across all active jobs. Called after create/update; cheap at demo scale. */
export async function recomputeTermVectors() {
  const jobs = await Job.find({ status: 'active' }).select('_id descriptionText title skills');
  const texts = jobs.map((j) => `${j.title} ${j.skills.join(' ')} ${j.descriptionText}`);
  const docFreq = buildDocFrequency(texts);

  await Promise.all(
    jobs.map((job, i) => {
      const vector = buildTermVector(texts[i], docFreq, jobs.length);
      return Job.updateOne({ _id: job._id }, { termVector: vector });
    })
  );
}
