import User from '../models/User.js';
import Job from '../models/Job.js';

export async function uploadResumeAndAutofill(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No resume file uploaded', code: 'FILE_REQUIRED' });

    const parsed = req.resumeParsed || { skills: [], experienceYears: 0, nameGuess: '' };

    req.user.candidateProfile.resumeUrl = `/uploads/${req.file.filename}`;
    req.user.candidateProfile.resumeText = req.resumeText || '';
    req.user.candidateProfile.skills = Array.from(new Set([...(req.user.candidateProfile.skills || []), ...parsed.skills]));
    if (!req.user.candidateProfile.experienceYears && parsed.experienceYears) {
      req.user.candidateProfile.experienceYears = parsed.experienceYears;
    }
    await req.user.save();

    res.json({ user: req.user.toSafeJSON(), parsed });
  } catch (err) {
    next(err);
  }
}

export async function updateCandidateProfile(req, res, next) {
  try {
    const { headline, skills, experienceYears, location } = req.body;
    if (headline !== undefined) req.user.candidateProfile.headline = headline;
    if (skills !== undefined) req.user.candidateProfile.skills = skills;
    if (experienceYears !== undefined) req.user.candidateProfile.experienceYears = experienceYears;
    if (location !== undefined) req.user.candidateProfile.location = location;
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
}

export async function saveSearch(req, res, next) {
  try {
    const { name, query } = req.body;
    req.user.candidateProfile.savedSearches.push({ name, query });
    await req.user.save();
    res.status(201).json({ savedSearches: req.user.candidateProfile.savedSearches });
  } catch (err) {
    next(err);
  }
}

export async function deleteSavedSearch(req, res, next) {
  try {
    req.user.candidateProfile.savedSearches = req.user.candidateProfile.savedSearches.filter(
      (s) => s._id.toString() !== req.params.searchId
    );
    await req.user.save();
    res.json({ savedSearches: req.user.candidateProfile.savedSearches });
  } catch (err) {
    next(err);
  }
}

export async function toggleSaveJob(req, res, next) {
  try {
    const jobId = req.params.jobId;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found', code: 'JOB_NOT_FOUND' });

    const idx = req.user.candidateProfile.savedJobs.findIndex((id) => id.toString() === jobId);
    let saved;
    if (idx >= 0) {
      req.user.candidateProfile.savedJobs.splice(idx, 1);
      saved = false;
    } else {
      req.user.candidateProfile.savedJobs.push(jobId);
      saved = true;
    }
    await req.user.save();
    res.json({ saved });
  } catch (err) {
    next(err);
  }
}

export async function listSavedJobs(req, res, next) {
  try {
    const user = await User.findById(req.user._id).populate('candidateProfile.savedJobs');
    res.json({ jobs: user.candidateProfile.savedJobs });
  } catch (err) {
    next(err);
  }
}
